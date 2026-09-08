using backend.Exceptions;
using backend.Helpers;
using backend.Models.Common;
using backend.Models.DTOs.Auth;
using Supabase.Gotrue;

namespace backend.Services
{
    public interface IAuthService
    {
        Task<(AuthResponseDto authResponseDto, string token, string refreshToken)> RegisterAsync(RegisterDto registerDto);
        Task<(AuthResponseDto authResponseDto, string token, string refreshToken)> LoginAsync(LoginDto loginDto);
        Task LogoutAsync(string token, string refreshToken);
        Task<AuthResponseDto> GetCurrentUserAsync(string token, string refreshToken);
        Task<AuthResponseDto> UpdateCurrentUserAsync(UpdateUserDto updateUserDto, string token, string refreshToken);
    }

    public class AuthService : IAuthService
    {
        public async Task<(AuthResponseDto authResponseDto, string token, string refreshToken)> RegisterAsync(RegisterDto registerDto)
        {
            registerDto.Username = registerDto.Username.Trim();
            ValidateUsername(registerDto.Username);
            ValidatePassword(registerDto.Password);

            var supabase = await SupabaseHelper.GetClientAsync();

            var signUpOptions = new SignUpOptions
            {
                Data = new Dictionary<string, object>
                {
                    { "display_name", registerDto.Username },
                    { "plan", "free" }
                }
            };

            await supabase.Auth.SignUp(
                registerDto.Email,
                registerDto.Password,
                signUpOptions
            );

            var session = await supabase.Auth.SignIn(
                registerDto.Email,
                registerDto.Password
            );

            if (session?.User == null)
            {
                Console.WriteLine("Error occured during sign-up. Please ensure that email confirmation is disabled from supabase settings.");
                throw new ValidationException("Failed to sign in after registration.");

            }

            var metadata = MetadataHelper.GetMetadata(session.User);

            var authResponseDto = new AuthResponseDto
            {
                User = new UserProfile
                {
                    Id = session.User.Id!,
                    Username = metadata["display_name"].ToString()!,
                    Email = session.User.Email!,
                    Plan = metadata["plan"].ToString()!,
                    CreatedAt = session.User.CreatedAt
                }
            };

            return (authResponseDto, session.AccessToken!, session.RefreshToken!);
        }

        public async Task<(AuthResponseDto authResponseDto, string token, string refreshToken)> LoginAsync(LoginDto loginDto)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            var session = await supabase.Auth.SignIn(
                loginDto.Email,
                loginDto.Password
            );

            if (session?.User == null)
                throw new ValidationException("Invalid credentials");

            var metadata = MetadataHelper.GetMetadata(session.User);

            var authResponseDto = new AuthResponseDto
            {
                User = new UserProfile
                {
                    Id = session.User.Id!,
                    Username = metadata["display_name"].ToString()!,
                    Email = session.User.Email!,
                    Plan = metadata["plan"].ToString()!,
                    CreatedAt = session.User.CreatedAt
                }
            };

            return (authResponseDto, session.AccessToken!, session.RefreshToken!);
        }

        public async Task LogoutAsync(string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();

            await supabase.Auth.SetSession(token, refreshToken);
            await supabase.Auth.SignOut();
        }

        public async Task<AuthResponseDto> GetCurrentUserAsync(string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            await supabase.Auth.SetSession(token, refreshToken);

            var user = supabase.Auth.CurrentUser;
            if (user == null)
                throw new UnauthorizedAccessException("Invalid or expired session");

            var metadata = MetadataHelper.GetMetadata(user);

            var authResponseDto = new AuthResponseDto
            {
                User = new UserProfile
                {
                    Id = user.Id!,
                    Username = metadata["display_name"].ToString()!,
                    Email = user.Email!,
                    Plan = metadata["plan"].ToString()!,
                    CreatedAt = user.CreatedAt
                }
            };

            return authResponseDto;
        }

        public async Task<AuthResponseDto> UpdateCurrentUserAsync(UpdateUserDto updateUserDto, string token, string refreshToken)
        {
            var supabase = await SupabaseHelper.GetClientAsync();
            await supabase.Auth.SetSession(token, refreshToken);

            var user = supabase.Auth.CurrentUser;
            if (user == null)
                throw new UnauthorizedAccessException("Invalid or expired session");

            var metadata = MetadataHelper.GetMetadata(user!);
            var userAttributes = new UserAttributes();

            if (updateUserDto.EmailAddress != null)
                userAttributes.Email = updateUserDto.EmailAddress;

            if (updateUserDto.DisplayName != null)
                metadata["display_name"] = updateUserDto.DisplayName;

            userAttributes.Data = metadata;
            await supabase.Auth.Update(userAttributes);

            user = supabase.Auth.CurrentUser;

            var authResponseDto = new AuthResponseDto
            {
                User = new UserProfile
                {
                    Id = user!.Id!,
                    Username = metadata["display_name"].ToString()!,
                    Email = user.Email!,
                    Plan = metadata["plan"].ToString()!,
                    CreatedAt = user.CreatedAt
                }
            };

            return authResponseDto;
        }

        private void ValidateUsername(string username)
        {
            if (username.Length < 3 || username.Length > 20)
                throw new ValidationException("Username must be 3-20 characters");

            if (!username.All(c => char.IsLetterOrDigit(c) || c == '_'))
                throw new ValidationException("Username can only contain letters, numbers, and underscores");
        }

        private void ValidatePassword(string password)
        {
            if (password.Length < 8)
                throw new ValidationException("Password must be at least 8 characters");

            if (!password.Any(char.IsUpper))
                throw new ValidationException("Password must contain at least one uppercase letter");

            if (!password.Any(char.IsLower))
                throw new ValidationException("Password must contain at least one lowercase letter");

            if (!password.Any(char.IsDigit))
                throw new ValidationException("Password must contain at least one number");

            if (!password.Any(c => !char.IsLetterOrDigit(c)))
                throw new ValidationException("Password must contain at least one special character");
        }
    }
}