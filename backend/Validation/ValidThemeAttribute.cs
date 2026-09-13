using System.ComponentModel.DataAnnotations;
using backend.Models.Common;

namespace backend.Validation
{
    public class ValidThemeAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is null)
                return ValidationResult.Success;

            var theme = value as string;

            if (theme is null || !ThemeOptions.Available.Contains(theme))
            {
                return new ValidationResult(
                    $"Unknown theme: {value}. Available themes: {string.Join(", ", ThemeOptions.Available)}");
            }

            return ValidationResult.Success;
        }
    }
}
