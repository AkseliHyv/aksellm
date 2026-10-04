[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-red.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

# AkseLLM

A self-hosted web app for managing and chatting with local LLM configurations that run on [Ollama](https://ollama.com). Users can create multiple named model configurations, each with its own parameters and system prompt, and chat with them through a persistent message history.

## Status

Core infrastructure, authentication, LLM configuration management and model inference are complete. AkseLLM can be run as a single container or as separate processes in dev mode. Responses are not yet streamed.

## Core Features

- Register and log in with email and password
- Create, edit and delete custom LLM configurations
- Configure model parameters per LLM (sampling, penalties, seed, streaming, stop sequences, system prompt)
- Have discussions with owned LLM configurations
- Update user profile information such as display name and theme

## Not yet implemented

- Response streaming and stop sequences, see [Ollama integration](docs/OLLAMA.md)
- Listing models dynamically from the connected Ollama instance

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v4 |
| State | Zustand (user, LLM list, modal, toast) |
| Backend | ASP.NET Core 10, C# |
| Auth / DB | JWT, Supabase (Gotrue + Postgrest) |
| Models | Ollama |
| Infra | Docker |

## Prerequisites

- A Supabase project configured as described in [Database setup](docs/DATABASE.md)
- A running Ollama instance with at least one model pulled, see [Ollama integration](docs/OLLAMA.md)

## Configure

Create a `.env` file in the repository root:

```
Supabase__Url=<your-supabase-project-url>
Supabase__PublicKey=<your-supabase-publishable-key>
```

| Field | Purpose |
|---|---|
| `Supabase__Url` | The project URL from Supabase's API settings. |
| `Supabase__PublicKey` | The project's publishable (anon) key. |
| `Ollama__BaseUrl` | Optional. The Ollama URL, `http://localhost:11434` by default. |

Both run modes read this file.

## Run as a container

Prerequisites: Docker

Add the following line to `.env` so the container can reach Ollama on the host:

```
Ollama__BaseUrl=http://host.docker.internal:11434
```

```
docker build -t aksellm .
docker run --env-file .env -p 8080:8080 --add-host=host.docker.internal:host-gateway aksellm
```

This makes AkseLLM run on ``http://localhost:8080``.

On Linux, Ollama only accepts connections from the host itself by default. Set `OLLAMA_HOST` so the container can reach it, see [Ollama integration](docs/OLLAMA.md#url-to-run-on).

## Run in dev mode

1. Run the backend, see [Backend](docs/BACKEND.md).
2. Run the frontend, see [Frontend](docs/FRONTEND.md).

The backend reads `.env` only in dev mode. The frontend runs on ``http://localhost:5173`` by default.

In dev mode, the frontend's dev server forwards every request under `/api` to the backend at `http://localhost:8000`. This keeps requests on the same origin in both run modes, as the container serves the frontend and backend from one origin. If the backend port is changed, update the proxy target in `frontend/vite.config.ts` to match.

## Documentation

- [Database](docs/DATABASE.md): Supabase schema, RLS policies, and functions.
- [Backend](docs/BACKEND.md): running the API locally, configuration, project structure, API reference
- [Frontend](docs/FRONTEND.md): running the web app locally, configuration, project structure
- [Ollama integration](docs/OLLAMA.md): setup, errors and the supported model list

## License

This project is licensed under CC BY-NC-SA 4.0.
See [LICENSE](LICENSE) for details.
