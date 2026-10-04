# Frontend

[← README](../README.md)

This page contains the steps required to get the frontend up and running.

## Prerequisite Information

The frontend is a React 19 and TypeScript single-page app built with Vite 7.
It uses Tailwind CSS v4 for styling and Zustand for state.

## Prerequisites

- Node.js 20+
- A running backend, see [Backend](BACKEND.md)

## Configure

### Backend URL

The frontend forwards requests under `/api` to `http://localhost:8000` by default.
Override it from `frontend/vite.config.ts`:

```
server: {
    ...
    proxy: {
      '/api': 'http://localhost:8000' // Line to change
    }
  }
```

This only applies in dev mode. In the container, the backend serves the frontend itself.

### URL to run on

The frontend points to `http://localhost:5173` by default.
Override it from `frontend/vite.config.ts`:

```
server: {
    port: 5173, // Line to change
    ...
  }
```

## Run

```
cd frontend
npm install
npm run dev
```

This makes the frontend run on the defined url, which is by default ``http://localhost:5173``.

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