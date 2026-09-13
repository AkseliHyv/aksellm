# Database setup

[← README](../README.md)

AkseLLM stores its data in Postgres through [Supabase](https://supabase.com), which also provides authentication (Gotrue).
Authorization is split between Postgres row level security (RLS) and the backend.
This page has the schema, the RLS policies, and a table showing which layer enforces each rule.

The backend connects to Supabase with the caller's own access token, using the project's publishable key rather than the service-role key (see [`SupabaseHelper.cs`](../backend/Helpers/SupabaseHelper.cs)).
Every query the backend runs executes as Postgres role `authenticated` with `auth.uid()` bound to that user.

## Create the project

Prerequisites: a Supabase account.

1. Create a Supabase project.
2. Disable email confirmation: Auth > Providers > Email > Confirm email = off.

## Schema

Run in the Supabase SQL editor:

```sql
create table llms (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users not null,
  name text not null,
  llm_config jsonb not null,
  created_at timestamptz default now()
);

create table messages (
  id bigint generated always as identity primary key,
  llm_id bigint references llms on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);
```

`messages.llm_id` cascades on delete, so removing an `llms` row removes its messages.

## Row level security

```sql
alter table llms enable row level security;
alter table messages enable row level security;

create policy "Users can view their own llms"
  on llms for select
  using (user_id = auth.uid());

create policy "Users can insert their own llms"
  on llms for insert
  with check (user_id = auth.uid());

create policy "Users can update their own llms"
  on llms for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own llms"
  on llms for delete
  using (user_id = auth.uid());

create policy "Users can view their own messages"
  on messages for select
  using (
    exists (
      select 1 from llms
      where llms.id = messages.llm_id
        and llms.user_id = auth.uid()
    )
  );

create policy "Users can send messages to their own llms"
  on messages for insert
  with check (
    exists (
      select 1 from llms
      where llms.id = messages.llm_id
        and llms.user_id = auth.uid()
    )
  );
```

`messages` has no UPDATE or DELETE policy, so chat history is append-only for regular users.
Deletion still happens through the `llms` DELETE policy and the cascade, described above.

## Per-user LLM limit

```sql
create or replace function enforce_llm_limit()
returns trigger as $$
begin
  if (select count(*) from llms where user_id = new.user_id) >= 15 then
    raise sqlstate 'PT400' using message = 'Maximum number of LLMs reached (15).';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger llm_limit_check
  before insert on llms
  for each row
  execute function enforce_llm_limit();
```

The LLM limit lives purely within this trigger.
A policy can only return true or false, which surfaces to the client as a generic "row violates row-level security policy" error.
The trigger uses PostgREST's `PT<status>` SQLSTATE convention to return an HTTP 400 with a readable message instead.
Change the limit by editing the number in the function.

## Per-LLM generation lock

```sql
alter table llms add column generating_since timestamptz;

create or replace function claim_llm_generation(target_llm bigint)
returns boolean as $$
declare
  claimed bigint;
begin
  update llms
  set generating_since = now()
  where id = target_llm
    and user_id = auth.uid()
    and (generating_since is null or generating_since < now() - interval '5 minutes')
  returning id into claimed;

  return claimed is not null;
end;
$$ language plpgsql;

create or replace function release_llm_generation(target_llm bigint)
returns void as $$
begin
  update llms
  set generating_since = null
  where id = target_llm and user_id = auth.uid();
end;
$$ language plpgsql;
```

`SendMessageAsync` in [`LLMService.cs`](../backend/Services/LLMService.cs) claims the lock before generating a response, releases it in a `finally` block, and returns HTTP 409 if the claim fails.
The 5 minute lease has to cover queue wait time plus generation time, and needs revisiting once real Ollama timings are known.

Both functions filter on `user_id = auth.uid()`, so a caller can only claim or release the lock on their own LLM.
PostgREST also exposes them directly at `/rest/v1/rpc/claim_llm_generation` and `/rest/v1/rpc/release_llm_generation`, reachable with the caller's own access token alone, without going through the backend.
The worst a caller can do through that path is release their own lock early and fire overlapping requests at their own LLM.

## Authorization

| Rule | Enforced by |
|---|---|
| Row ownership (`user_id = auth.uid()`) | Both |
| Max 15 LLMs per account | Supabase |
| One generation in flight per LLM | Supabase, called by the backend |
| Message `role` in (`user`, `assistant`, `system`) | Supabase |
| Chat history is append-only | Supabase |
| Messages removed when their LLM is deleted | Supabase |
| Identity (sign up, log in, sessions) | Supabase Auth (Gotrue) |

### Row ownership

RLS enforces it on every query regardless of the backend's own `WHERE` clause.
The backend repeats the check to turn an RLS-filtered empty result into a proper 404 instead of a silent empty response, and to stay correct if the backend ever used a service-role key.

### Max 15 LLMs per account

The `enforce_llm_limit` trigger blocks the insert.

### One generation in flight per LLM

`claim_llm_generation` and `release_llm_generation` are the actual lock.
The backend only calls them and maps a failed claim to HTTP 409.

### Message role

A CHECK constraint.
The backend only ever writes `"user"` or `"assistant"` literals, so this is a backstop against a future bug.

### Chat history is append-only

`messages` has no UPDATE or DELETE policy.

### Messages removed when their LLM is deleted

`ON DELETE CASCADE` on `messages.llm_id`.
Postgres runs the cascade as part of the constraint, not as the calling role, so it is not subject to RLS on `messages`.

### Identity

The backend only relays the access and refresh tokens between the client's cookies and Supabase.
See [`AuthService.cs`](../backend/Services/AuthService.cs).
