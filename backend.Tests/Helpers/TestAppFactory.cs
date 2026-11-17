using System.Runtime.CompilerServices;
using System.Security.Claims;
using System.Text;
using backend.Models.Common;
using backend.Models.DTOs.Auth;
using backend.Models.DTOs.LLM;
using backend.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace backend.Tests.Helpers
{
    // Runs the real app in memory with the legacy JWT secret, so tokens can be signed in tests.
    // IAuthService and ILLMService are replaced with fakes, so no request reaches Supabase or Ollama.
    public class TestAppFactory : WebApplicationFactory<Program>
    {
        public const string SupabaseUrl = "http://supabase.test";
        public const string Issuer = $"{SupabaseUrl}/auth/v1";
        public const string Audience = "authenticated";
        public const string JwtSecret = "test-jwt-secret-that-is-at-least-32-bytes-long";

        public FakeAuthService AuthService { get; } = new();

        public FakeLLMService LLMService { get; } = new();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // Not "Development", so the real .env in the repository root is not loaded
            builder.UseEnvironment("Testing");

            builder.UseSetting("Supabase:Url", SupabaseUrl);
            builder.UseSetting("Supabase:PublicKey", "test-public-key");
            builder.UseSetting("Supabase:JwtSecret", JwtSecret);

            builder.ConfigureTestServices(services =>
            {
                services.AddScoped<IAuthService>(sp =>
                {
                    AuthService.UserClient = sp.GetRequiredService<ISupabaseUserClient>();
                    return AuthService;
                });

                services.AddSingleton<ILLMService>(LLMService);
            });
        }

        public static string CreateToken(
            string subject = "user-123",
            string issuer = Issuer,
            string audience = Audience,
            string secret = JwtSecret,
            DateTime? expires = null)
        {
            var expiresAt = expires ?? DateTime.UtcNow.AddHours(1);

            var descriptor = new SecurityTokenDescriptor
            {
                Issuer = issuer,
                Audience = audience,
                Subject = new ClaimsIdentity([new Claim("sub", subject)]),
                IssuedAt = expiresAt.AddHours(-2),
                NotBefore = expiresAt.AddHours(-2),
                Expires = expiresAt,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                    SecurityAlgorithms.HmacSha256)
            };

            return new JsonWebTokenHandler().CreateToken(descriptor);
        }
    }

    public class FakeAuthService : IAuthService
    {
        public ISupabaseUserClient? UserClient { get; set; }

        public (string token, string refreshToken)? RefreshedWith { get; private set; }

        public Task<(string token, string refreshToken)> RefreshSessionAsync(string token, string refreshToken)
        {
            RefreshedWith = (token, refreshToken);
            return Task.FromResult(("new-token", "new-refresh-token"));
        }

        public Task<AuthResponseDto> GetCurrentUserAsync()
        {
            return Task.FromResult(CreateResponse(UserClient!.UserId));
        }

        public Task<(AuthResponseDto authResponseDto, string token, string refreshToken)> RegisterAsync(RegisterDto registerDto)
        {
            return Task.FromResult((CreateResponse("user-123"), "token", "refresh-token"));
        }

        public Task<(AuthResponseDto authResponseDto, string token, string refreshToken)> LoginAsync(LoginDto loginDto)
        {
            return Task.FromResult((CreateResponse("user-123"), "token", "refresh-token"));
        }

        public Task LogoutAsync(string token, string refreshToken) => throw new NotImplementedException();
        public Task<AuthResponseDto> UpdateCurrentUserAsync(UpdateUserDto updateUserDto) => throw new NotImplementedException();

        private static AuthResponseDto CreateResponse(string userId)
        {
            return new AuthResponseDto
            {
                User = new UserProfile
                {
                    Id = userId,
                    Username = "tester",
                    Email = "tester@example.com",
                    Theme = "Catppuccin",
                    CreatedAt = DateTime.UtcNow
                }
            };
        }
    }

    // Streams wait until ReleaseStreams() is called, so a test can keep a chat request running.
    public class FakeLLMService : ILLMService
    {
        private readonly TaskCompletionSource _release = new(TaskCreationOptions.RunContinuationsAsynchronously);
        private int _startedStreams;

        public int StartedStreams => _startedStreams;

        public void ReleaseStreams() => _release.TrySetResult();

        public async IAsyncEnumerable<StreamEventDto> StreamMessageAsync(int id, string message, [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            Interlocked.Increment(ref _startedStreams);
            yield return new StreamEventDto { Type = "start" };

            await _release.Task.WaitAsync(cancellationToken);
            yield return new StreamEventDto { Type = "chunk", Content = "Hello" };
        }

        public Task<LLMResponseDto> GetAllLLMsAsync()
        {
            return Task.FromResult(new LLMResponseDto { LLMs = [] });
        }

        public Task<LLMResponseDto> GetLLMByIdAsync(int id) => throw new NotImplementedException();
        public Task<LLMResponseDto> CreateLLMAsync(CreateLLMDto createLLMDto) => throw new NotImplementedException();
        public Task<LLMResponseDto> UpdateLLMAsync(int id, UpdateLLMDto updateLLMDto) => throw new NotImplementedException();
        public Task DeleteLLMAsync(int id) => throw new NotImplementedException();
        public Task<GetMessagesDto> GetLLMMessagesAsync(int id) => throw new NotImplementedException();
        public Task<MessageResponseDto> SendMessageAsync(int id, string message) => throw new NotImplementedException();
    }
}
