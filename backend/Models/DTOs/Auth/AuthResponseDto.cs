using System.ComponentModel.DataAnnotations;
using backend.Models.Common;

namespace backend.Models.DTOs.Auth
{
    public class AuthResponseDto
    {
        [Required]
        public required UserProfile User { get; set; }
        public string? Message { get; set; }
    }
}