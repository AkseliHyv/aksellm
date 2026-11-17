using backend.Models.Common;

namespace backend.Models.DTOs.LLM
{
    public class StreamEventDto
    {
        public required string Type { get; set; }

        public string? Content { get; set; }

        public Message? UserMessage { get; set; }

        public Message? AssistantMessage { get; set; }
    }
}
