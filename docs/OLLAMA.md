# Ollama integration

[← README](../README.md)

AkseLLM is designed to run model inference through [Ollama](https://ollama.com), but that connection is not built yet.
`SendMessageAsync` in [`LLMService.cs`](../backend/Services/LLMService.cs) saves the user's message, saves a hardcoded string as the assistant's response, and returns both.

## Supported models

The model list is a fixed allow list, picked to cover distinct sizes and specializations rather than many close variants of the same model:

- `llama3.2` (3B, ~2GB): smallest and fastest, general purpose
- `mistral` (7B, ~4.4GB): general purpose
- `qwen2.5` (7B, ~4.7GB): general purpose, strong multilingual support
- `gemma2` (9B, ~5.4GB): general purpose
- `deepseek-r1` (8B, ~5.2GB): reasoning-focused
- `qwen2.5-coder` (7B, ~4.7GB): coding-focused
- `phi4` (14B, ~9.1GB): largest and highest-quality, needs more RAM/VRAM than the rest

The list is defined in two places that must be kept in sync by hand:

- [`backend/Models/Common/ProviderModels.cs`](../backend/Models/Common/ProviderModels.cs), used by `ValidModelForProviderAttribute` to validate an LLM configuration's model field.
- [`frontend/src/domain/enums/ProviderModels.ts`](../frontend/src/domain/enums/ProviderModels.ts), used to populate the model picker in the UI.

`Ollama` is currently the only entry in `LLMProvider` on both sides ([backend](../backend/Models/Common/LLMProvider.cs), [frontend](../frontend/src/domain/enums/LLMProvider.ts)).

Removing a model from this list does not stop existing LLMs using it from being read or chatted with.
It does block further edits to them: `UpdateLLMDto` revalidates the whole `LLMConfig` (including `Model`) whenever `Config` is present in the request, even if only another field like `Temperature` changed, so the edit fails until `Model` is changed to one still on the list.

## Remaining work

- A call from the backend to a running Ollama instance, passing the LLM's configured parameters (temperature, max tokens, top-p, top-k, repeat penalty, seed, stop sequences, system prompt) and the chat history.
- Streaming the response back to the frontend. The `stream` toggle exists in the LLM configuration model but nothing reads it yet.
- Any check that a configured model is actually pulled and available on the target Ollama instance.
