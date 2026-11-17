using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Tests.Helpers;

namespace backend.Tests
{
    public class AuthenticationTests : IClassFixture<TestAppFactory>
    {
        private readonly TestAppFactory _factory;
        private readonly HttpClient _client;

        public AuthenticationTests(TestAppFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        private async Task<HttpResponseMessage> SendAsync(HttpMethod method, string path, string? cookies = null)
        {
            var request = new HttpRequestMessage(method, path);

            if (cookies != null)
                request.Headers.Add("Cookie", cookies);

            return await _client.SendAsync(request);
        }

        private static async Task AssertUnauthorizedAsync(HttpResponseMessage response)
        {
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("Unauthorized. Please authenticate and try again.", body.GetProperty("message").GetString());
        }

        [Fact]
        public async Task Me_WithValidToken_ReturnsUserFromTokenSubject()
        {
            var token = TestAppFactory.CreateToken(subject: "user-abc");

            var response = await SendAsync(HttpMethod.Get, "/api/auth/me", $"token={token}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var body = await response.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("user-abc", body.GetProperty("user").GetProperty("id").GetString());
        }

        [Fact]
        public async Task Me_WithoutCookie_Returns401()
        {
            var response = await SendAsync(HttpMethod.Get, "/api/auth/me");

            await AssertUnauthorizedAsync(response);
        }

        [Fact]
        public async Task Me_WithExpiredToken_Returns401()
        {
            var token = TestAppFactory.CreateToken(expires: DateTime.UtcNow.AddMinutes(-1));

            var response = await SendAsync(HttpMethod.Get, "/api/auth/me", $"token={token}");

            await AssertUnauthorizedAsync(response);
        }

        [Fact]
        public async Task Me_WithWrongAudience_Returns401()
        {
            var token = TestAppFactory.CreateToken(audience: "anon");

            var response = await SendAsync(HttpMethod.Get, "/api/auth/me", $"token={token}");

            await AssertUnauthorizedAsync(response);
        }

        [Fact]
        public async Task Me_WithWrongIssuer_Returns401()
        {
            var token = TestAppFactory.CreateToken(issuer: "http://other-project.test/auth/v1");

            var response = await SendAsync(HttpMethod.Get, "/api/auth/me", $"token={token}");

            await AssertUnauthorizedAsync(response);
        }

        [Fact]
        public async Task Me_WithTokenSignedByOtherKey_Returns401()
        {
            var token = TestAppFactory.CreateToken(secret: "some-other-secret-that-is-at-least-32-bytes");

            var response = await SendAsync(HttpMethod.Get, "/api/auth/me", $"token={token}");

            await AssertUnauthorizedAsync(response);
        }

        [Fact]
        public async Task Me_WithMalformedToken_Returns401()
        {
            var response = await SendAsync(HttpMethod.Get, "/api/auth/me", "token=not-a-jwt");

            await AssertUnauthorizedAsync(response);
        }

        [Theory]
        [InlineData("GET", "/api/llm")]
        [InlineData("GET", "/api/llm/1")]
        [InlineData("POST", "/api/llm")]
        [InlineData("PATCH", "/api/llm/1")]
        [InlineData("DELETE", "/api/llm/1")]
        [InlineData("GET", "/api/llm/1/chat")]
        [InlineData("POST", "/api/llm/1/chat")]
        [InlineData("POST", "/api/llm/1/chat/stream")]
        [InlineData("PATCH", "/api/auth/update")]
        public async Task ProtectedEndpoints_WithoutCookie_Return401(string method, string path)
        {
            var response = await SendAsync(new HttpMethod(method), path);

            await AssertUnauthorizedAsync(response);
        }

        [Fact]
        public async Task Refresh_WithoutCookies_Returns401()
        {
            var response = await SendAsync(HttpMethod.Post, "/api/auth/refresh");

            await AssertUnauthorizedAsync(response);
        }

        [Fact]
        public async Task Refresh_WithExpiredToken_SetsNewCookies()
        {
            var expiredToken = TestAppFactory.CreateToken(expires: DateTime.UtcNow.AddMinutes(-1));

            var response = await SendAsync(HttpMethod.Post, "/api/auth/refresh", $"token={expiredToken}; refreshToken=old-refresh-token");

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
            Assert.Equal((expiredToken, "old-refresh-token"), _factory.AuthService.RefreshedWith);

            var cookies = response.Headers.GetValues("Set-Cookie").ToList();
            Assert.Contains(cookies, c => c.StartsWith("token=new-token;"));
            Assert.Contains(cookies, c => c.StartsWith("refreshToken=new-refresh-token;"));
            Assert.All(cookies, c =>
            {
                Assert.Contains("httponly", c, StringComparison.OrdinalIgnoreCase);
                Assert.Contains("secure", c, StringComparison.OrdinalIgnoreCase);
                Assert.Contains("samesite=strict", c, StringComparison.OrdinalIgnoreCase);
            });
        }
    }
}
