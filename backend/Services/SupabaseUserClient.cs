using System.Security.Claims;
using backend.Helpers;

namespace backend.Services
{
    public interface ISupabaseUserClient
    {
        string UserId { get; }
        string AccessToken { get; }
        Task<Supabase.Client> GetClientAsync();
    }

    public class SupabaseUserClient(IHttpContextAccessor httpContextAccessor) : ISupabaseUserClient
    {
        private Supabase.Client? _client;

        private HttpContext Context => httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("No active HTTP request");

        public string UserId => Context.User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("Token has no subject");

        public string AccessToken => Context.Request.Cookies["token"]
            ?? throw new UnauthorizedAccessException("Missing authentication cookie");

        public async Task<Supabase.Client> GetClientAsync()
        {
            return _client ??= await SupabaseHelper.GetClientAsync(AccessToken);
        }
    }
}
