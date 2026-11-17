namespace backend.Helpers
{
    public static class SupabaseHelper
    {
        public static async Task<Supabase.Client> GetClientAsync(string? accessToken = null)
        {
            var (url, key) = GetConfig();

            var options = new Supabase.SupabaseOptions
            {
                AutoConnectRealtime = false
            };

            if (accessToken != null)
                options.Headers["Authorization"] = $"Bearer {accessToken}";

            var supabase = new Supabase.Client(url, key, options);
            await supabase.InitializeAsync();

            return supabase;
        }

        public static Supabase.Gotrue.Api GetAuthApi()
        {
            var (url, key) = GetConfig();
            return new Supabase.Gotrue.Api($"{url.TrimEnd('/')}/auth/v1", new Dictionary<string, string> { ["apikey"] = key });
        }

        private static (string url, string key) GetConfig()
        {
            var url = Environment.GetEnvironmentVariable("SUPABASE_URL");
            var key = Environment.GetEnvironmentVariable("SUPABASE_PUBLIC_KEY");

            if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(key))
                throw new InvalidOperationException("SUPABASE_URL and SUPABASE_PUBLIC_KEY must be set");

            return (url, key);
        }
    }
}
