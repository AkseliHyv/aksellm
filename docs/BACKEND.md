# Backend

[← README](../README.md)

This page contains the steps required to get the backend up and running.

## Prerequisite Information

The backend is an ASP.NET Core 10 API in C#. It authenticates requests with tokens stored in HttpOnly cookies and forwards them to Supabase for both authentication and data access.

## Prerequisites

- .NET 10 SDK
- A Supabase project configured as described in [Database setup](DATABASE.md)
- A running Ollama instance, see [Ollama integration](OLLAMA.md)

## Configure

### CORS & Supabase

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
| `Supabase:PublicKey` | The project's publishable (anon) key. |

### Ollama URL

The backend sends requests to Ollama at `http://localhost:11434` by default.
Override it with the following field in `backend/appsettings.Development.json`:

```
"Ollama": {
  "BaseUrl": "http://localhost:11434" // Line to change
}
```

### URL to run on

The backend points to `http://localhost:8000` by default.
Override it from `backend/Properties/launchSettings.json`:

```
"http/https": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://localhost:8000", // Line to change
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
```

## Run

```
cd backend
dotnet restore
dotnet run
```

This makes the backend run on the defined url, which is by default ``http://localhost:8000``.

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
  Filters/             # ExceptionFilter* (maps exceptions to HTTP status codes)
  Exceptions/          # NotFoundException, ValidationException, ConflictException
  Validation/          # ValidModelForProviderAttribute
  Program.cs
  appsettings.json
  appsettings.Development.json
```

\*ExceptionFilter is used to catch, handle, and return every otherwise uncatched error. As a matter of fact, it handles most backend-side errors that occur, both expected and unexpected.

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
| PATCH | `/api/auth/update` | Update display name and theme |
| POST | `/api/auth/logout` | Log out and clear cookies |

### LLM configurations

| Method | Path | Description |
|---|---|---|
| GET | `/api/llm` | List all LLMs for the authenticated user |
| GET | `/api/llm/{id}` | Get a single LLM |
| POST | `/api/llm` | Create a new LLM configuration
| PATCH | `/api/llm/{id}` | Update an existing LLM configuration |
| DELETE | `/api/llm/{id}` | Delete an LLM and its messages |

### Chat

| Method | Path | Description |
|---|---|---|
| GET | `/api/llm/{id}/chat` | Get the last 50 messages for an LLM |
| POST | `/api/llm/{id}/chat` | Send a message and get the model's response, see [Ollama integration](OLLAMA.md). Returns 409 if this LLM is already generating a response |
