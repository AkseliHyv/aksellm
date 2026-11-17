using System.ComponentModel.DataAnnotations;
using backend.Models.Common;
using backend.Models.DTOs.Auth;

namespace backend.Tests
{
    public class ValidationAttributeTests
    {
        private static List<ValidationResult> Validate(object instance)
        {
            var results = new List<ValidationResult>();
            Validator.TryValidateObject(instance, new ValidationContext(instance), results, validateAllProperties: true);
            return results;
        }

        [Theory]
        [InlineData(null)]
        [InlineData("Catppuccin")]
        [InlineData("Tokyo Night")]
        [InlineData("Solarized Dark")]
        public void ValidTheme_AcceptsKnownThemesAndNull(string? theme)
        {
            Assert.Empty(Validate(new UpdateUserDto { Theme = theme }));
        }

        [Theory]
        [InlineData("Unknown")]
        [InlineData("nord")]
        [InlineData("")]
        public void ValidTheme_RejectsUnknownThemes(string theme)
        {
            var result = Assert.Single(Validate(new UpdateUserDto { Theme = theme }));

            Assert.StartsWith($"Unknown theme: {theme}.", result.ErrorMessage);
        }

        [Fact]
        public void ValidModelForProvider_AcceptsListedModel()
        {
            var config = new LLMConfig { Provider = LLMProvider.Ollama, Model = "llama3.2:3b" };

            Assert.Empty(Validate(config));
        }

        [Fact]
        public void ValidModelForProvider_RejectsUnlistedModel()
        {
            var config = new LLMConfig { Provider = LLMProvider.Ollama, Model = "gpt-4" };

            var result = Assert.Single(Validate(config));
            Assert.StartsWith("Provider Ollama has no Model named gpt-4.", result.ErrorMessage);
        }

        [Fact]
        public void ValidModelForProvider_RejectsUnknownProvider()
        {
            var config = new LLMConfig { Provider = (LLMProvider)99, Model = "llama3.2:3b" };

            var result = Assert.Single(Validate(config));
            Assert.Equal("Unknown provider: 99", result.ErrorMessage);
        }
    }
}
