using System.ComponentModel.DataAnnotations;
using backend.Models.Common;

namespace backend.Models.DTOs.Auth
{
    public class UpdateUserDto
    {
        public string? DisplayName { get; set; }
        [EmailAddress]
        public string? EmailAddress { get; set; }
    }
}