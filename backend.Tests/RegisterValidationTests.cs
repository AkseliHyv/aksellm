using backend.Exceptions;
using backend.Models.DTOs.Auth;
using backend.Services;

namespace backend.Tests
{
    // RegisterAsync validates the username and password before contacting Supabase,
    // so invalid input can be tested without a Supabase project.
    public class RegisterValidationTests
    {
        private static Task<ValidationException> RegisterAsync(string username, string password)
        {
            var authService = new AuthService(null!);
            var registerDto = new RegisterDto { Username = username, Email = "tester@example.com", Password = password };

            return Assert.ThrowsAsync<ValidationException>(() => authService.RegisterAsync(registerDto));
        }

        [Theory]
        [InlineData("ab", "Username must be 3-20 characters")]
        [InlineData("   ab   ", "Username must be 3-20 characters")]
        [InlineData("abcdefghijklmnopqrstu", "Username must be 3-20 characters")]
        [InlineData("bad name", "Username can only contain letters, numbers, and underscores")]
        [InlineData("bad-name", "Username can only contain letters, numbers, and underscores")]
        [InlineData("bad.name", "Username can only contain letters, numbers, and underscores")]
        public async Task InvalidUsername_IsRejected(string username, string expectedMessage)
        {
            var exception = await RegisterAsync(username, "ValidPass1!");

            Assert.Equal(expectedMessage, exception.Message);
        }

        [Theory]
        [InlineData("Sh0rt!", "Password must be at least 8 characters")]
        [InlineData("nouppercase1!", "Password must contain at least one uppercase letter")]
        [InlineData("NOLOWERCASE1!", "Password must contain at least one lowercase letter")]
        [InlineData("NoNumbers!", "Password must contain at least one number")]
        [InlineData("NoSpecial123", "Password must contain at least one special character")]
        public async Task InvalidPassword_IsRejected(string password, string expectedMessage)
        {
            var exception = await RegisterAsync("valid_user", password);

            Assert.Equal(expectedMessage, exception.Message);
        }
    }
}
