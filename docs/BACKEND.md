# Backend

[← README](../README.md)

The backend is an ASP.NET Core 10 API in C#.
It authenticates requests with tokens stored in HttpOnly cookies and forwards them to Supabase for both authentication and data access.

## Prerequisites

- .NET 10 SDK
- A Supabase project configured as described in [Database setup](DATABASE.md)

## Configure

Create `backend/appsettings.Development.json`:

```json
{
  "AllowedOrigins": "http://localhost:5173",
  "Supabase": {
    "Url": "<your-supabase-project-url>",
    "PublicKey": "<your-supabase-publishable-key>"
  }
}
```

| Field | Purpose |
|---|---|
| `AllowedOrigins` | Comma-separated list of origins allowed by CORS. Must include the frontend's origin. |
| `Supabase:Url` | The project URL from Supabase's API settings. |
| `Supabase:PublicKey` | The project's publishable (anon) key. RLS restricts access. |

## Run

Prerequisites: configuration above complete.

1. `cd backend`
2. `dotnet restore`
3. `dotnet run`

Expected result: the terminal prints `Now listening on: http://localhost:8000`.

## Project structure

```text
backend/
  Controllers/         # AuthController, LLMController
  Services/            # AuthService, LLMService
  Models/
    Common/            # LLMConfig, LLMModel, Message, UserProfile, LLMProvider, ProviderModels
    Domain/            # LLMEntity, MessageEntity (Postgrest ORM entities)
    DTOs/              # Request and response shapes
  Helpers/             # CookieHelper, SupabaseHelper, MetadataHelper
  Filters/             # ExceptionFilter (maps exceptions to HTTP status codes)
  Exceptions/          # NotFoundException, ValidationException, ConflictException
  Validation/          # ValidModelForProviderAttribute
  Program.cs
  appsettings.json
  appsettings.Development.json
```

`ExceptionFilter` is the single place that turns exceptions into HTTP responses: `ValidationException` to 400, `NotFoundException` to 404, `ConflictException` to 409, Supabase Auth/Postgrest errors to 400 (or 502 for a 5xx from Supabase itself), `UnauthorizedAccessException` to 401, anything else to 500.

## API

All endpoints are under `/api`.
Auth tokens are stored in HttpOnly cookies (`token`, `refreshToken`, `SameSite=Strict`) and sent automatically by the browser with `credentials: include`.
No `Authorization` header is used.

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get the current user's profile |
| PATCH | `/api/auth/update` | Update display name or email |
| POST | `/api/auth/logout` | Log out and clear cookies |

### LLM configurations

| Method | Path | Description |
|---|---|---|
| GET | `/api/llm` | List all LLMs for the authenticated user |
| GET | `/api/llm/{id}` | Get a single LLM |
| POST | `/api/llm` | Create a new LLM configuration, see [per-user limit](DATABASE.md#per-user-llm-limit) |
| PATCH | `/api/llm/{id}` | Update an existing LLM configuration |
| DELETE | `/api/llm/{id}` | Delete an LLM and its messages |

### Chat

| Method | Path | Description |
|---|---|---|
| GET | `/api/llm/{id}/chat` | Get the last 50 messages for an LLM |
| POST | `/api/llm/{id}/chat` | Send a message, see [Ollama integration](OLLAMA.md). Returns 409 if this LLM is already generating a response |
