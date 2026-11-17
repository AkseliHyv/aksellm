using System.Net;
using System.Text.Json;
using backend.Exceptions;
using backend.Filters;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging.Abstractions;
using Supabase.Gotrue.Exceptions;
using Supabase.Postgrest.Exceptions;

namespace backend.Tests
{
    public class ExceptionFilterTests
    {
        private static (int? statusCode, string? message) Handle(Exception exception)
        {
            var actionContext = new ActionContext(new DefaultHttpContext(), new RouteData(), new ActionDescriptor());
            var context = new ExceptionContext(actionContext, []) { Exception = exception };

            new ExceptionFilter(NullLogger<ExceptionFilter>.Instance).OnException(context);

            Assert.True(context.ExceptionHandled);
            var result = Assert.IsAssignableFrom<ObjectResult>(context.Result);
            var body = JsonSerializer.SerializeToElement(result.Value);

            return (result.StatusCode, body.GetProperty("message").GetString());
        }

        // The Supabase exceptions only set StatusCode internally
        private static T WithStatusCode<T>(T exception, int statusCode) where T : Exception
        {
            typeof(T).GetProperty("StatusCode")!.SetValue(exception, statusCode);
            return exception;
        }

        [Fact]
        public void ValidationException_Returns400WithMessage()
        {
            Assert.Equal((400, "Invalid input"), Handle(new ValidationException("Invalid input")));
        }

        [Fact]
        public void NotFoundException_Returns404WithMessage()
        {
            Assert.Equal((404, "LLM not found"), Handle(new NotFoundException("LLM not found")));
        }

        [Fact]
        public void ConflictException_Returns409WithMessage()
        {
            Assert.Equal((409, "Already generating"), Handle(new ConflictException("Already generating")));
        }

        [Fact]
        public void UnauthorizedAccessException_Returns401()
        {
            Assert.Equal((401, "Unauthorized. Please authenticate and try again."), Handle(new UnauthorizedAccessException("Missing cookie")));
        }

        [Fact]
        public void InvalidOperationException_Returns400WithMessage()
        {
            Assert.Equal((400, "Bad state"), Handle(new InvalidOperationException("Bad state")));
        }

        [Fact]
        public void UnknownException_Returns500WithoutLeakingMessage()
        {
            Assert.Equal((500, "An unexpected error occurred. Please try again later."), Handle(new Exception("secret internals")));
        }

        [Fact]
        public void GotrueException_401_Returns401()
        {
            var exception = WithStatusCode(new GotrueException("{\"msg\":\"JWT expired\"}"), 401);

            Assert.Equal((401, "Unauthorized. Please authenticate and try again."), Handle(exception));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(500)]
        [InlineData(503)]
        public void GotrueException_InfrastructureError_Returns502(int statusCode)
        {
            var exception = WithStatusCode(new GotrueException("upstream failure"), statusCode);

            Assert.Equal((502, "A dependent service is unavailable. Please try again shortly."), Handle(exception));
        }

        [Fact]
        public void GotrueException_ClientError_Returns400WithParsedMsg()
        {
            var exception = WithStatusCode(new GotrueException("{\"code\":422,\"msg\":\"User already registered\"}"), 422);

            Assert.Equal((400, "User already registered"), Handle(exception));
        }

        [Fact]
        public void PostgrestException_ClientError_Returns400WithParsedMessage()
        {
            var exception = WithStatusCode(new PostgrestException("{\"message\":\"duplicate key value\"}"), 409);

            Assert.Equal((400, "duplicate key value"), Handle(exception));
        }

        [Fact]
        public void GotrueException_ClientErrorWithPlainText_Returns400WithRawMessage()
        {
            var exception = WithStatusCode(new GotrueException("not json"), 400);

            Assert.Equal((400, "not json"), Handle(exception));
        }

        [Fact]
        public void HttpRequestException_NotFound_Returns502ModelUnavailable()
        {
            var exception = new HttpRequestException("Not found", null, HttpStatusCode.NotFound);

            Assert.Equal((502, "The selected model is not available on the server."), Handle(exception));
        }

        [Fact]
        public void HttpRequestException_NoStatusCode_Returns503()
        {
            var exception = new HttpRequestException("Connection refused");

            Assert.Equal((503, "The LLM service is unreachable. Please try again shortly."), Handle(exception));
        }

        [Fact]
        public void HttpRequestException_OtherStatusCode_Returns502()
        {
            var exception = new HttpRequestException("Server error", null, HttpStatusCode.InternalServerError);

            Assert.Equal((502, "The LLM service returned an error. Please try again shortly."), Handle(exception));
        }
    }
}
