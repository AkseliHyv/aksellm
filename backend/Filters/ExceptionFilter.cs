using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Supabase.Postgrest.Exceptions;
using Supabase.Gotrue.Exceptions;
using backend.Exceptions;
using System.Text.Json;

namespace backend.Filters
{
    public class ExceptionFilter : IExceptionFilter
    {
        private readonly ILogger _logger;

        public ExceptionFilter(ILogger<ExceptionFilter> logger)
        {
            _logger = logger;
        }

        public void OnException(ExceptionContext context)
        {
            if (context.Exception is ValidationException)
            {
                context.Result = new BadRequestObjectResult(new { message = context.Exception.Message });
                context.ExceptionHandled = true;
                return;
            }

            if (context.Exception is NotFoundException)
            {
                context.Result = new NotFoundObjectResult(new { message = context.Exception.Message });
                context.ExceptionHandled = true;
                return;
            }

            if (context.Exception is ConflictException)
            {
                context.Result = new ConflictObjectResult(new { message = context.Exception.Message });
                context.ExceptionHandled = true;
                return;
            }

            if (context.Exception is GotrueException or PostgrestException)
            {
                int statusCode = context.Exception switch
                {
                    GotrueException ge => ge.StatusCode,
                    PostgrestException pe => pe.StatusCode,
                    _ => 0
                };

                var errorMessage = ParseSupabaseError(context.Exception.Message);

                if (statusCode == 0 || statusCode >= 500)
                {
                    _logger.LogError(context.Exception, "Supabase infrastructure error: {Message}", context.Exception.Message);
                    context.Result = new ObjectResult(new { message = "A dependent service is unavailable. Please try again shortly." })
                    {
                        StatusCode = StatusCodes.Status502BadGateway
                    };
                }
                else
                {
                    context.Result = new BadRequestObjectResult(new { message = errorMessage });
                }
                context.ExceptionHandled = true;
                return;
            }

            if (context.Exception is UnauthorizedAccessException)
            {
                _logger.LogWarning("Unauthorized access attempt: {Message}", context.Exception.Message);
                context.Result = new UnauthorizedObjectResult(new { message = "Unauthorized. Please authenticate and try again." });
                context.ExceptionHandled = true;
                return;
            }

            if (context.Exception is InvalidOperationException)
            {
                context.Result = new BadRequestObjectResult(new { message = context.Exception.Message });
                context.ExceptionHandled = true;
                return;
            }

            _logger.LogError(context.Exception, "An unhandled error occurred: {Message}", context.Exception.Message);
            context.Result = new ObjectResult(new { message = "An unexpected error occurred. Please try again later." })
            {
                StatusCode = StatusCodes.Status500InternalServerError
            };
            context.ExceptionHandled = true;
        }

        private string ParseSupabaseError(string errorJson)
        {
            try
            {
                using var doc = JsonDocument.Parse(errorJson);

                if (doc.RootElement.TryGetProperty("msg", out var msg))
                    return msg.GetString() ?? errorJson;

                if (doc.RootElement.TryGetProperty("message", out var message))
                    return message.GetString() ?? errorJson;

                return errorJson;
            }
            catch
            {
                return errorJson;
            }
        }
    }
}