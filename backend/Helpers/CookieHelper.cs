namespace backend.Helpers
{
    public static class CookieHelper
    {
        public static (string token, string refreshToken) GetTokensFromCookies(IRequestCookieCollection cookies)
        {
            string? token = cookies["token"];
            string? refreshToken = cookies["refreshToken"];

            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(refreshToken))
                throw new UnauthorizedAccessException("Missing authentication cookies");

            return (token, refreshToken);
        }
    }
}