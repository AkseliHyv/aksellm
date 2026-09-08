using System.ComponentModel.DataAnnotations;
using Supabase.Gotrue;

namespace backend.Helpers
{
    public static class MetadataHelper
    {
        public static Dictionary<string, object> GetMetadata(User user)
        {
            var metadata = user.UserMetadata ?? new Dictionary<string, object>();

            metadata.TryGetValue("display_name", out var displayNameObj);
            metadata.TryGetValue("plan", out var planObj);

            var displayName =
                displayNameObj?.ToString()
                ?? user.Email!;

            var plan =
                planObj?.ToString()
                ?? "free";

            var result = new Dictionary<string, object>
            {
                ["display_name"] = displayName,
                ["plan"] = plan
            };

            return result;
        }
    }
}