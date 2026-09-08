using System.ComponentModel.DataAnnotations;
using backend.Models.Common;

namespace backend.Models.DTOs.LLM
{
    public class MessageResponseDto
    {
        [Required]
        public required Message UserMessage { get; set; }

        [Required]
        public required Message AssistantMessage { get; set; }
    }
}