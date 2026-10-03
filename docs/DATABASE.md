# Database setup

[← README](../README.md)

This page contains the steps required to get the database 
up and running.

## Prerequisite Information

AkseLLM stores its data in Postgres through [Supabase](https://supabase.com), which also provides authentication (Gotrue). Authorization is split between Postgres row level security (RLS) and the backend. The backend connects to the database using the Supabase project's publishable key (see [`SupabaseHelper.cs`](../backend/Helpers/SupabaseHelper.cs)). Every query the backend runs executes as Postgres role `authenticated` with `auth.uid()` bound to that user.

## Prerequisites

- A Supabase account

## Create the project
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
  generating_since timestamptz,
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

This creates the 2 tables that the project uses to store it's data. A separate users table is not necessary, as Supabase provides it's own auth table. 


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

This enables and creates all the row-level-security policies which govern user access levels. Not setting these will allow any user to alter any table without any limitations (excluding the auth table provided by Supabase).

## Per-LLM generation lock

```sql
create or replace function claim_llm_generation(target_llm bigint)
returns boolean as $$
declare
  claimed bigint;
begin
  update llms
     set generating_since = now()
   where id = target_llm
     and user_id = auth.uid()
     and (generating_since is null
          or generating_since < now() - interval '5 minutes')
  returning id into claimed;

  return claimed is not null;
end;
$$ language plpgsql;

create or replace function release_llm_generation(target_llm bigint)
returns void as $$
begin
  update llms
     set generating_since = null
   where id = target_llm
     and user_id = auth.uid();
end;
$$ language plpgsql;
```

This creates the function that manages LLM generation locks to prevent concurrent requests to the same configuration. The 5 minute interval is a modifiable fallback that exists to release the lock in case of an unexpected error.

Note that `/rest/v1/rpc/claim_llm_generation` and `/rest/v1/rpc/release_llm_generation` are reachable with the caller's own access token alone, without going through the backend. However, the worst a caller can do through that path is release their own lock early and fire overlapping requests at their own LLM.