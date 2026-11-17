# Backend

[← README](../README.md)

This page contains the steps required to get the backend up and running.

## Prerequisite Information

The backend is an ASP.NET Core 10 API in C#. It authenticates requests with tokens stored in HttpOnly cookies, validates them itself and forwards them to Supabase for data access.

## Prerequisites

- .NET 10 SDK
- A Supabase project configured as described in [Database setup](DATABASE.md)
- A running Ollama instance, see [Ollama integration](OLLAMA.md)

## Configure

### Supabase & Ollama

The backend reads its Supabase keys and Ollama URL from the `.env` file in the repository root, see [Configure](../README.md#configure).

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

If the port is changed, update the proxy target in `frontend/vite.config.ts` to match.

## Run

```
cd backend
dotnet restore
dotnet run
```

This makes the backend run on the defined url, which is by default ``http://localhost:8000``.

## Test

```
cd backend.Tests
dotnet test
```

The tests run the API in memory and do not need Supabase or Ollama.
They cover authentication, rate limiting, error handling and input validation.

## Project structure

```text
backend/
  Controllers/         # AuthController, LLMController
  Services/            # AuthService, LLMService, SupabaseUserClient
  Models/
    Common/            # LLMConfig, LLMModel, Message, UserProfile, LLMProvider, ProviderModels
    Domain/            # LLMEntity, MessageEntity (Postgrest ORM entities)
    DTOs/              # Request and response shapes
  Helpers/             # CookieHelper, SupabaseHelper, MetadataHelper, JwksRetriever, RateLimitHelper
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
Expired or invalid tokens return `401`.
Expired tokens are renewed with `/api/auth/refresh`, which the frontend calls on a `401` before retrying the request once.
Requests over a rate limit return `429`, see [Rate limits](#rate-limits).

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/refresh` | Refresh the session and update cookies |
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
| POST | `/api/llm/{id}/chat` | Send a message and get the model's response, see [Ollama integration](OLLAMA.md). Returns 429 if the user already has a response generating |
| POST | `/api/llm/{id}/chat/stream` | Send a message and stream the model's response as NDJSON. Returns 429 if the user already has a response generating |

### Rate limits

| Endpoints | Limit | Counted per |
|---|---|---|
| `register`, `login` | 5 requests per minute in total, as a sliding window | IP address |
| `refresh` | 30 requests per minute | IP address |
| `POST chat`, `POST chat/stream` | 1 response generating at a time | User |
| Everything else | 120 requests per minute | User |