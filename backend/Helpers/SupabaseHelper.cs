namespace backend.Helpers
{
    public static class SupabaseHelper
    {
        public static async Task<Supabase.Client> GetClientAsync()
        {
            var url = Environment.GetEnvironmentVariable("SUPABASE_URL");
            var key = Environment.GetEnvironmentVariable("SUPABASE_PUBLIC_KEY");

            if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(key))
                throw new InvalidOperationException("SUPABASE_URL and SUPABASE_PUBLIC_KEY must be set");

            var options = new Supabase.SupabaseOptions
            {
                AutoConnectRealtime = false
            };

            var supabase = new Supabase.Client(url, key, options);
            await supabase.InitializeAsync();

            return supabase;
        }
    }
}