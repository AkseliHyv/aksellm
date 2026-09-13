import { LLMProvider } from "./LLMProvider";

export const ProviderModels: Record<LLMProvider, string[]> = {
    [LLMProvider.Ollama]: ["llama3.2", "mistral", "qwen2.5", "gemma2", "deepseek-r1", "qwen2.5-coder", "phi4"],
};