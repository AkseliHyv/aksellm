[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-red.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

# AkseLLM

A self-hosted web app for managing and chatting with local LLM configurations backed by [Ollama](https://ollama.com). Users can create multiple named model configurations, each with its own parameters and system prompt, and chat with them through a persistent message history.

## Status

Core infrastructure, authentication, and LLM configuration management are complete. The chat UI is functional but model inference is not yet connected. Sending a message saves it to the database and returns a placeholder response. See [Not yet implemented](#not-yet-implemented).

---

## Features

- Register and log in with email and password
- Create up to 15 named LLM configurations per account
- Configure model parameters per LLM: temperature, max tokens, top-p, top-k, frequency/presence/repeat penalties, seed, stream toggle, stop sequences, and system prompt
- Edit or delete existing configurations
- Persistent chat history per LLM (last 50 messages)
- Optimistic message UI with rollback on failure
- One response in flight per LLM, enforced in the database. Concurrent sends to the same LLM return 409
- HttpOnly cookie authentication (SameSite=Strict)

## Not yet implemented

- Actual Ollama inference: sending a message currently returns `"placeholder"` as the assistant response and persists it to the database
- Running each service in docker containers with k8s
- Token refresh: sessions are not renewed automatically after the Supabase access token expires (~1 hour)
- Account settings: the username update form is a stub with no backend wiring
- General and Plan settings tabs are empty stubs
- Account setting changes are not stored

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v4 |
| State | Zustand (user, LLM list, modal, toast) |
| Backend | ASP.NET Core 10, C# |
| Auth / DB | Supabase (Gotrue + Postgrest) |
| Models | Ollama (planned) |
| Infra | Kubernetes, Docker, nginx |

---

## Project structure

```
aksellm/
  backend/
    Controllers/        # AuthController, LLMController
    Services/           # AuthService, LLMService
    Models/
      Common/           # LLMConfig, LLMModel, Message, UserProfile, LLMProvider, ProviderModels
      Domain/           # LLMEntity, MessageEntity (Postgrest ORM entities)
      DTOs/             # Request and response shapes
    Helpers/            # CookieHelper, SupabaseHelper, MetadataHelper
    Filters/            # Global exception filter
    Exceptions/         # NotFoundException, ValidationException
    Validation/         # ValidModelForProviderAttribute
    Program.cs
    appsettings.json
    appsettings.Development.json
  frontend/
    src/
      components/
        ui/             # Avatar, Message, Modal, TextField
        modals/         # AuthModal, LLMCreateModal, LLMSettingsModal, LogoutConfirmModal, UserSettingsModal
      stores/           # useLLMStore, useModalStore, useToastStore, useUserStore
      services/         # api.ts (fetch wrapper), authService.ts, llmService.ts
      domain/           # TypeScript types and enums
      App.tsx
      ModalRenderer.tsx
      ToastRenderer.tsx
```

---

## Running locally

### Prerequisites

- .NET 10 SDK
- Node.js 20+
- A Supabase project with email confirmation disabled

### Supabase setup

The app uses Supabase for authentication (Gotrue) and data storage (Postgrest). You need:

1. A Supabase project with email confirmation disabled (Auth > Email > Confirm email = off)
2. Run the following in the Supabase SQL editor to create the tables, enable RLS, and add the policies:

```sql
-- Tables
create table llms (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users not null,
  name text not null,
  llm_config jsonb not null,
  created_at timestamptz default now()
);

create table messages (
  id bigint generated always as identity primary key,
  llm_id bigint references llms not null,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table llms enable row level security;
alter table messages enable row level security;

-- llms policies
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

-- messages policies
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

-- Per-user LLM limit
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

-- Per-LLM generation lock, with an expiring lease so a crashed request
-- does not lock the LLM permanently
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

The RLS policies enforce ownership on both tables. `messages` has no UPDATE or DELETE policy, so history is append-only.

The 15-configuration limit lives in the `enforce_llm_limit` trigger rather than the INSERT policy. A policy can only return true or false, which surfaces as a generic `row violates row-level security policy` error. The trigger uses PostgREST's `PT<status>` SQLSTATE convention to return a 400 with a readable message instead. Change the limit by editing the number in the function.

`claim_llm_generation` and `release_llm_generation` back the per-LLM send lock. `SendMessageAsync` claims before generating, releases in a `finally`, and returns 409 if the claim fails. The 5 minute lease must cover queue wait plus generation time, not just generation. It needs revisiting once real Ollama timings are known.

### Backend

Fill in `appsettings.Development.json` with your Supabase project URL and anon key:

```json
{
  "AllowedOrigins": "http://localhost:5173",
  "Supabase": {
    "Url": "<your-supabase-url>",
    "PublicKey": "<your-supabase-anon-key>"
  }
}
```

Then run:

```bash
cd backend
dotnet restore
dotnet run
```

Runs on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. The frontend points to `http://localhost:8000` by default. Override with a `.env` file:

```
VITE_API_URL=http://localhost:8000
```

---

## API

All endpoints are under `/api`. Auth tokens are stored in HttpOnly cookies and sent automatically with `credentials: include`.

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get the current user's profile |
| POST | `/api/auth/logout` | Log out and clear cookies |

### LLM configurations

| Method | Path | Description |
|---|---|---|
| GET | `/api/llm` | List all LLMs for the authenticated user |
| GET | `/api/llm/:id` | Get a single LLM |
| POST | `/api/llm` | Create a new LLM configuration |
| PUT | `/api/llm/:id` | Update an existing LLM configuration |
| DELETE | `/api/llm/:id` | Delete an LLM |

### Chat

| Method | Path | Description |
|---|---|---|
| GET | `/api/llm/:id/chat` | Get the last 50 messages for an LLM |
| POST | `/api/llm/:id/chat` | Send a message (inference not yet implemented). Returns 409 if this LLM is already generating a response |

---

## Supported models

Only Ollama is supported as a provider. The available models are:

- `llama3.2`
- `mistral`
- `deepseek-r1`
- `phi4`

The allowed model list is defined in `backend/Models/Common/ProviderModels.cs` and mirrored in `frontend/src/domain/enums/ProviderModels.ts`. Both files need to be updated when adding new models.

---

## License

This project is licensed under CC BY-NC-SA 4.0. See [LICENSE](LICENSE) for details.
