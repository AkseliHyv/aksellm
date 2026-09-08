using System.ComponentModel.DataAnnotations;
using backend.Models.Common;

namespace backend.Models.DTOs.LLM
{
    public class GetMessagesDto
    {
        [Required]
        public required IEnumerable<Message> ChatMessages { get; set; }
    }
}