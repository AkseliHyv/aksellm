using System.Security.Claims;

namespace backend.Helpers
{
    public static class RateLimitHelper
    {
        public const string Auth = "auth";
        public const string Refresh = "refresh";
        public const string Chat = "chat";
        public const string General = "general";

        public static string GetClientKey(HttpContext context)
        {
            return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        public static string GetUserKey(HttpContext context)
        {
            return context.User.FindFirstValue("sub") ?? GetClientKey(context);
        }
    }
}