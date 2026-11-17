using System.Security.Cryptography;
using backend.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Tokens;
using Supabase.Gotrue;

namespace backend.Tests
{
    public class CookieHelperTests
    {
        [Fact]
        public void GetTokensFromCookies_ReturnsBothTokens()
        {
            var context = new DefaultHttpContext();
            context.Request.Headers.Cookie = "token=access; refreshToken=refresh";

            Assert.Equal(("access", "refresh"), CookieHelper.GetTokensFromCookies(context.Request.Cookies));
        }

        [Theory]
        [InlineData("")]
        [InlineData("token=access")]
        [InlineData("refreshToken=refresh")]
        [InlineData("token=; refreshToken=refresh")]
        public void GetTokensFromCookies_WithMissingToken_Throws(string cookieHeader)
        {
            var context = new DefaultHttpContext();
            context.Request.Headers.Cookie = cookieHeader;

            Assert.Throws<UnauthorizedAccessException>(() => CookieHelper.GetTokensFromCookies(context.Request.Cookies));
        }

        [Fact]
        public void SetTokenCookies_SetsSecureHttpOnlyStrictCookies()
        {
            var context = new DefaultHttpContext();

            CookieHelper.SetTokenCookies(context.Response, "access", "refresh");

            var cookies = context.Response.Headers.SetCookie.ToList();
            Assert.Equal(2, cookies.Count);
            Assert.Contains(cookies, c => c!.StartsWith("token=access;"));
            Assert.Contains(cookies, c => c!.StartsWith("refreshToken=refresh;"));
            Assert.All(cookies, c =>
            {
                Assert.Contains("httponly", c, StringComparison.OrdinalIgnoreCase);
                Assert.Contains("secure", c, StringComparison.OrdinalIgnoreCase);
                Assert.Contains("samesite=strict", c, StringComparison.OrdinalIgnoreCase);
            });
        }
    }

    public class MetadataHelperTests
    {
        [Fact]
        public void GetMetadata_WithoutMetadata_FallsBackToEmailAndDefaultTheme()
        {
            var user = new User { Email = "tester@example.com", UserMetadata = null! };

            var metadata = MetadataHelper.GetMetadata(user);

            Assert.Equal("tester@example.com", metadata["display_name"]);
            Assert.Equal("Catppuccin", metadata["theme"]);
        }

        [Fact]
        public void GetMetadata_UsesStoredValuesAndDropsOtherKeys()
        {
            var user = new User
            {
                Email = "tester@example.com",
                UserMetadata = new Dictionary<string, object>
                {
                    ["display_name"] = "tester",
                    ["theme"] = "Nord",
                    ["email_verified"] = true
                }
            };

            var metadata = MetadataHelper.GetMetadata(user);

            Assert.Equal(2, metadata.Count);
            Assert.Equal("tester", metadata["display_name"]);
            Assert.Equal("Nord", metadata["theme"]);
        }
    }

    public class JwksRetrieverTests
    {
        private class FakeDocumentRetriever(string document) : IDocumentRetriever
        {
            public string? RequestedAddress { get; private set; }

            public Task<string> GetDocumentAsync(string address, CancellationToken cancel)
            {
                RequestedAddress = address;
                return Task.FromResult(document);
            }
        }

        [Fact]
        public async Task GetConfigurationAsync_LoadsRsaAndEcSigningKeys()
        {
            using var rsa = RSA.Create(2048);
            using var ec = ECDsa.Create(ECCurve.NamedCurves.nistP256);
            var rsaParameters = rsa.ExportParameters(false);
            var ecParameters = ec.ExportParameters(false);

            var jwks = $$"""
                {
                  "keys": [
                    { "kty": "RSA", "kid": "rsa-key", "use": "sig", "alg": "RS256",
                      "n": "{{Base64UrlEncoder.Encode(rsaParameters.Modulus)}}",
                      "e": "{{Base64UrlEncoder.Encode(rsaParameters.Exponent)}}" },
                    { "kty": "EC", "kid": "ec-key", "use": "sig", "alg": "ES256", "crv": "P-256",
                      "x": "{{Base64UrlEncoder.Encode(ecParameters.Q.X)}}",
                      "y": "{{Base64UrlEncoder.Encode(ecParameters.Q.Y)}}" }
                  ]
                }
                """;

            const string address = "http://supabase.test/auth/v1/.well-known/jwks.json";
            var retriever = new FakeDocumentRetriever(jwks);

            var configuration = await new JwksRetriever().GetConfigurationAsync(address, retriever, CancellationToken.None);

            Assert.Equal(address, retriever.RequestedAddress);
            Assert.Equal(address, configuration.JwksUri);
            Assert.Equal(["ec-key", "rsa-key"], configuration.SigningKeys.Select(k => k.KeyId).Order());
        }
    }
}
