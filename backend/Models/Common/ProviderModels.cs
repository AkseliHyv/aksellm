namespace backend.Models.Common
{
    public static class ProviderModels
    {
        public static readonly Dictionary<LLMProvider, string[]> Available = new()
        {
            [LLMProvider.Ollama] = [
                "llama3.2",
                "mistral",
                "qwen2.5",
                "gemma2",
                "deepseek-r1",
                "qwen2.5-coder",
                "phi4"
            ],
        };
    }
}