using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Tests.Helpers;

namespace backend.Tests
{
    // Each test makes its own app, because the limiters keep their counts for as long as the app runs.
    // Every in-memory request comes from the same client address, so IP-based limits are shared within a test.
    public class RateLimitingTests
    {
        private const string LoginBody = "{\"email\":\"tester@example.com\",\"password\":\"ValidPass1!\"}";
        private const string RegisterBody = "{\"username\":\"tester\",\"email\":\"tester@example.com\",\"password\":\"ValidPass1!\"}";

        private static Task<HttpResponseMessage> SendAsync(HttpClient client, HttpMethod method, string path, string? cookies = null, string? json = null)
        {
            var request = new HttpRequestMessage(method, path);

            if (cookies != null)
                request.Headers.Add("Cookie", cookies);

            if (json != null)
                request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            return client.SendAsync(request);
        }

        private static string TokenCookie(string userId)
        {
            return $"token={TestAppFactory.CreateToken(subject: userId)}";
        }

        private static async Task AssertTooManyRequestsAsync(HttpResponseMessage response)
        {
            Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("Too many requests. Please try again shortly.", body.GetProperty("message").GetString());
        }

        private static async Task WaitUntilAsync(Func<bool> condition)
        {
            var timeout = DateTime.UtcNow.AddSeconds(5);

            while (!condition())
            {
                if (DateTime.UtcNow > timeout)
                    throw new TimeoutException("The condition was not met in time");

                await Task.Delay(10);
            }
        }

        [Fact]
        public async Task Login_SixthRequestInAMinute_Returns429()
        {
            using var factory = new TestAppFactory();
            var client = factory.CreateClient();

            for (var i = 0; i < 5; i++)
            {
                var allowed = await SendAsync(client, HttpMethod.Post, "/api/auth/login", json: LoginBody);
                Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
            }

            var response = await SendAsync(client, HttpMethod.Post, "/api/auth/login", json: LoginBody);

            await AssertTooManyRequestsAsync(response);

            // The sliding window limiter does not report how long to wait
            Assert.False(response.Headers.Contains("Retry-After"));
        }

        [Fact]
        public async Task RegisterAndLogin_ShareOneLimit()
        {
            using var factory = new TestAppFactory();
            var client = factory.CreateClient();

            for (var i = 0; i < 3; i++)
                Assert.Equal(HttpStatusCode.Created, (await SendAsync(client, HttpMethod.Post, "/api/auth/register", json: RegisterBody)).StatusCode);

            for (var i = 0; i < 2; i++)
                Assert.Equal(HttpStatusCode.OK, (await SendAsync(client, HttpMethod.Post, "/api/auth/login", json: LoginBody)).StatusCode);

            await AssertTooManyRequestsAsync(await SendAsync(client, HttpMethod.Post, "/api/auth/login", json: LoginBody));
        }

        [Fact]
        public async Task Refresh_ThirtyFirstRequestInAMinute_Returns429WithRetryAfter()
        {
            using var factory = new TestAppFactory();
            var client = factory.CreateClient();
            const string cookies = "token=old-token; refreshToken=old-refresh-token";

            for (var i = 0; i < 30; i++)
                Assert.Equal(HttpStatusCode.NoContent, (await SendAsync(client, HttpMethod.Post, "/api/auth/refresh", cookies)).StatusCode);

            var response = await SendAsync(client, HttpMethod.Post, "/api/auth/refresh", cookies);

            await AssertTooManyRequestsAsync(response);
            var retryAfter = int.Parse(response.Headers.GetValues("Retry-After").Single());
            Assert.InRange(retryAfter, 1, 60);
        }

        [Fact]
        public async Task General_LimitIsCountedPerUser()
        {
            using var factory = new TestAppFactory();
            var client = factory.CreateClient();
            var userA = TokenCookie("user-a");

            for (var i = 0; i < 120; i++)
                Assert.Equal(HttpStatusCode.OK, (await SendAsync(client, HttpMethod.Get, "/api/llm", userA)).StatusCode);

            await AssertTooManyRequestsAsync(await SendAsync(client, HttpMethod.Get, "/api/llm", userA));

            // A different user has their own count
            Assert.Equal(HttpStatusCode.OK, (await SendAsync(client, HttpMethod.Get, "/api/llm", TokenCookie("user-b"))).StatusCode);
        }

        [Fact]
        public async Task General_UnauthenticatedRequestsGet401AndUseNoLimit()
        {
            using var factory = new TestAppFactory();
            var client = factory.CreateClient();

            // The limiter runs after authorization, so these never reach it
            for (var i = 0; i < 130; i++)
                Assert.Equal(HttpStatusCode.Unauthorized, (await SendAsync(client, HttpMethod.Get, "/api/llm")).StatusCode);
        }

        [Fact]
        public async Task Chat_SecondStreamFromSameUser_Returns429UntilFirstEnds()
        {
            using var factory = new TestAppFactory();
            var client = factory.CreateClient();
            var user = TokenCookie("user-a");

            var first = SendAsync(client, HttpMethod.Post, "/api/llm/1/chat/stream", user, "\"Hi\"");
            await WaitUntilAsync(() => factory.LLMService.StartedStreams == 1);

            await AssertTooManyRequestsAsync(await SendAsync(client, HttpMethod.Post, "/api/llm/2/chat/stream", user, "\"Hi\""));

            factory.LLMService.ReleaseStreams();
            Assert.Equal(HttpStatusCode.OK, (await first).StatusCode);

            // The slot is free again once the first stream has finished
            Assert.Equal(HttpStatusCode.OK, (await SendAsync(client, HttpMethod.Post, "/api/llm/2/chat/stream", user, "\"Hi\"")).StatusCode);
        }

        [Fact]
        public async Task Chat_NonStreamingMessageSharesTheSameSlot()
        {
            using var factory = new TestAppFactory();
            var client = factory.CreateClient();
            var user = TokenCookie("user-a");

            var stream = SendAsync(client, HttpMethod.Post, "/api/llm/1/chat/stream", user, "\"Hi\"");
            await WaitUntilAsync(() => factory.LLMService.StartedStreams == 1);

            await AssertTooManyRequestsAsync(await SendAsync(client, HttpMethod.Post, "/api/llm/2/chat", user, "\"Hi\""));

            factory.LLMService.ReleaseStreams();
            await stream;
        }

        [Fact]
        public async Task Chat_DifferentUsersCanStreamAtTheSameTime()
        {
            using var factory = new TestAppFactory();
            var client = factory.CreateClient();

            var first = SendAsync(client, HttpMethod.Post, "/api/llm/1/chat/stream", TokenCookie("user-a"), "\"Hi\"");
            var second = SendAsync(client, HttpMethod.Post, "/api/llm/1/chat/stream", TokenCookie("user-b"), "\"Hi\"");

            // Both streams got past the limiter and are running at once
            await WaitUntilAsync(() => factory.LLMService.StartedStreams == 2);

            factory.LLMService.ReleaseStreams();
            Assert.Equal(HttpStatusCode.OK, (await first).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await second).StatusCode);
        }
    }
}
