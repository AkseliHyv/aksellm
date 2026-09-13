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
            metadata.TryGetValue("theme", out var themeObj);

            var displayName =
                displayNameObj?.ToString()
                ?? user.Email!;

            var theme =
                themeObj?.ToString()
                ?? "Catppuccin";

            var result = new Dictionary<string, object>
            {
                ["display_name"] = displayName,
                ["theme"] = theme
            };

            return result;
        }
    }
}