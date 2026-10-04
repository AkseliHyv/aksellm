# Ollama integration

[← README](../README.md)

This page contains the steps required to get Ollama up and running.

## Prerequisite Information

AkseLLM runs model inference through [Ollama](https://ollama.com). When a message is sent, `SendMessageAsync` in [`LLMService.cs`](../backend/Services/LLMService.cs) sends the LLM's system prompt, the 9 latest messages and the new message to Ollama along with the LLM's configured parameters. Once Ollama responds, the user's message and the assistant's response are saved together and returned. If Ollama fails, neither message is saved.

## Prerequisites

- Ollama installed, see [Ollama's download page](https://ollama.com/download)

## Configure

### URL to run on

Ollama points to `http://localhost:11434` by default.
Override it with the `OLLAMA_HOST` environment variable:

```
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

If the URL is changed, the backend must be configured to match, see [Backend](BACKEND.md).

## Run

```
ollama serve
```

This makes Ollama run on the defined url, which is by default ``http://localhost:11434``.

## Pull a model

```
ollama pull llama3.2
```

This downloads the model to the Ollama instance. Any LLM configuration using a model that has not been pulled will fail to respond.

Note that model names must match exactly. A name without a tag resolves to `:latest`, so pulling `qwen2.5:0.5b` does not make `qwen2.5` available.

## Supported models
The model list is a fixed allow list, picked to cover distinct sizes and specializations, ordered from lightest to heaviest:

- `llama3.2:3b` (3B, ~2GB): smallest and fastest, general purpose
- `qwen2.5-coder:7b` (7B, ~4.7GB): coding-focused
- `deepseek-r1:8b` (8B, ~5.2GB): reasoning-focused
- `ministral-3:8b` (8B, ~6.0GB): general purpose, supports image input
- `gemma4:e4b` (E4B, ~6.6GB): general purpose, supports image input
- `qwen3.5:9b` (9B, ~6.6GB): general purpose, strong multilingual support, supports image input
- `gemma4:12b` (12B, ~8.0GB): largest, needs more RAM/VRAM than the rest

The list is defined in two places that must be kept in sync by hand:

- [`backend/Models/Common/ProviderModels.cs`](../backend/Models/Common/ProviderModels.cs), used by `ValidModelForProviderAttribute` to validate an LLM configuration's model field.
- [`frontend/src/domain/enums/ProviderModels.ts`](../frontend/src/domain/enums/ProviderModels.ts), used to populate the model picker in the UI.

`Ollama` is currently the only entry in `LLMProvider` on both sides ([backend](../backend/Models/Common/LLMProvider.cs), [frontend](../frontend/src/domain/enums/LLMProvider.ts)). This is due to a legacy implementation, and might be expanded on in the future.

Any existing llm configuration using a removed model will be unable to provide responses. It will also be impossible to modify any llm configuration fields, save for the `Model` field. Both of these issues are fixed after the configuration's `Model` field is set to use a valid model.

## Errors

| Status | Cause |
|---|---|
| 502 | The model has not been pulled, or Ollama returned another error |
| 503 | Ollama is unreachable |
| 500 | Ollama did not respond within 5 minutes |

## Remaining work

- Passing `StopSequences` to Ollama. The field is stored but nothing sends it yet.
- Streaming the response back to the frontend. The `stream` toggle exists in the LLM configuration model but nothing reads it yet.
- Any check that a configured model is actually pulled before a message is sent.
