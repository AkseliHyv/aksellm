namespace backend.Models.Common
{
    public static class ProviderModels
    {
        public static readonly Dictionary<LLMProvider, string[]> Available = new()
        {
            [LLMProvider.Ollama] = [
                "llama3.2:3b",
                "qwen2.5-coder:7b",
                "deepseek-r1:8b",
                "ministral-3:8b",
                "gemma4:e4b",
                "qwen3.5:9b",
                "gemma4:12b"
            ],
        };
    }
}