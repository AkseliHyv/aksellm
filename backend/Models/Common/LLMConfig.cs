using System.ComponentModel.DataAnnotations;
using backend.Validation;

namespace backend.Models.Common
{
    public class LLMConfig
    {
        [Required]
        public required LLMProvider Provider { get; set; }
        [Required]
        [ValidModelForProvider]
        public required string Model { get; set; }
        [Required]
        public double Temperature { get; set; } = 0.7;
        [Required]
        public int MaxTokens { get; set; } = 200;
        public string? SystemPrompt { get; set;}
        public double? TopP { get; set; }
        public int? TopK { get; set; }
        public double? RepeatPenalty { get; set; }
        public int? Seed { get; set; }
        public bool Stream { get; set; } = true;
        public string[]? StopSequences { get; set; }
    }
}