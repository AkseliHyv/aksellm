using backend.Validation;

namespace backend.Models.DTOs.Auth
{
    public class UpdateUserDto
    {
        public string? DisplayName { get; set; }

        [ValidTheme]
        public string? Theme { get; set; }
    }
}
