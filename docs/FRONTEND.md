# Frontend

[← README](../README.md)

The frontend is a React 19 and TypeScript single-page app built with Vite 7.
It uses Tailwind CSS v4 for styling and Zustand for state.

## Prerequisites

- Node.js 20+
- A running backend, see [Backend](BACKEND.md)

## Configure

The frontend points to `http://localhost:8000` by default.
Override it with a `.env` file in `frontend/`:

```dotenv
VITE_API_URL=http://localhost:8000
```

## Run

Prerequisites: see [Prerequisites](#prerequisites).

1. `cd frontend`
2. `npm install`
3. `npm run dev`

Expected result: Vite prints a local URL, `http://localhost:5173` by default.

## Project structure

```text
frontend/
  src/
    components/
      ui/                # Avatar, Message, Modal, TextField
      modals/            # AuthModal, LLMCreateModal, LLMSettingsModal, LogoutConfirmModal, UserSettingsModal
      ChatPanel.tsx
      SideBar.tsx
    stores/               # useLLMStore, useModalStore, useToastStore, useUserStore
    services/             # api.ts (fetch wrapper), authService.ts, llmService.ts
    domain/               # TypeScript types and enums
    App.tsx
    ModalRenderer.tsx
    ToastRenderer.tsx
```

`services/api.ts` wraps `fetch` with `credentials: "include"` so the auth cookies set by the backend are sent on every request, and throws on any non-2xx response using the backend's `message` field.
