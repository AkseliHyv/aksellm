[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-red.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

# AkseLLM

A self-hosted web app for managing and chatting with local LLM configurations backed by [Ollama](https://ollama.com).
Users can create multiple named model configurations, each with its own parameters and system prompt, and chat with them through a persistent message history.

## Status

Core infrastructure, authentication, and LLM configuration management are complete.
The chat UI is functional but model inference is not yet connected.

## Features

- Register and log in with email and password
- Create named LLM configurations per account, up to the limit described in [Database setup](docs/DATABASE.md#per-user-llm-limit)
- Configure model parameters per LLM (sampling, penalties, seed, streaming, stop sequences, system prompt)
- Edit or delete existing configurations
- Update display name from account settings
- Persistent chat history per LLM (last 50 messages)
- Optimistic message UI with rollback on failure
- One response in flight per LLM, enforced in the database
- JWT-based authentication in HttpOnly cookies

## Not yet implemented

- Ollama inference, see [Ollama integration](docs/OLLAMA.md)
- Running the frontend and backend in Docker containers via a local run script, with Ollama on a separate host connected over the network
- General settings tab is an empty stub

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v4 |
| State | Zustand (user, LLM list, modal, toast) |
| Backend | ASP.NET Core 10, C# |
| Auth / DB | Supabase (Gotrue + Postgrest) |
| Models | Ollama (planned) |
| Infra | Docker (planned) |

## Quick start

1. Set up the database, see [Database setup](docs/DATABASE.md).
2. Run the backend, see [Backend](docs/BACKEND.md).
3. Run the frontend, see [Frontend](docs/FRONTEND.md).

## Documentation

- [Database setup](docs/DATABASE.md): Supabase schema, RLS policies, and which layer (backend or Supabase) enforces each rule
- [Backend](docs/BACKEND.md): running the API locally, configuration, project structure, API reference
- [Frontend](docs/FRONTEND.md): running the web app locally, configuration, project structure
- [Ollama integration](docs/OLLAMA.md): status of model inference and the supported model list

## License

This project is licensed under CC BY-NC-SA 4.0.
See [LICENSE](LICENSE) for details.
