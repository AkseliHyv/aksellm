using System.Text.Json;
using System.Text.Json.Serialization;
using backend.Helpers;
using backend.Models.DTOs.LLM;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LLMController : ControllerBase
    {
        private static readonly JsonSerializerOptions StreamJsonOptions = new(JsonSerializerDefaults.Web)
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private readonly ILogger<LLMController> _logger;
        private readonly ILLMService _llmService;

        public LLMController(ILogger<LLMController> logger, ILLMService llmService)
        {
            _logger = logger;
            _llmService = llmService;
        }

        [HttpGet]
        public async Task<ActionResult<LLMResponseDto>> GetAllLLMs()
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var (result, newToken, newRefreshToken) = await _llmService.GetAllLLMsAsync(token, refreshToken);

            if (newToken != null && newRefreshToken != null)
                CookieHelper.SetTokenCookies(Response, newToken, newRefreshToken);

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LLMResponseDto>> GetLLMById(int id)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var (result, newToken, newRefreshToken) = await _llmService.GetLLMByIdAsync(id, token, refreshToken);

            if (newToken != null && newRefreshToken != null)
                CookieHelper.SetTokenCookies(Response, newToken, newRefreshToken);

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<LLMResponseDto>> CreateLLM([FromBody] CreateLLMDto createLLMDto)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var (result, newToken, newRefreshToken) = await _llmService.CreateLLMAsync(createLLMDto, token, refreshToken);

            if (newToken != null && newRefreshToken != null)
                CookieHelper.SetTokenCookies(Response, newToken, newRefreshToken);

            return Created(string.Empty, result);
        }

        [HttpPatch("{id}")]
        public async Task<ActionResult<LLMResponseDto>> UpdateLLM(int id, [FromBody] UpdateLLMDto updateLLMDto)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var (result, newToken, newRefreshToken) = await _llmService.UpdateLLMAsync(id, updateLLMDto, token, refreshToken);

            if (newToken != null && newRefreshToken != null)
                CookieHelper.SetTokenCookies(Response, newToken, newRefreshToken);

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLLM(int id)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var (newToken, newRefreshToken) = await _llmService.DeleteLLMAsync(id, token, refreshToken);

            if (newToken != null && newRefreshToken != null)
                CookieHelper.SetTokenCookies(Response, newToken, newRefreshToken);

            return NoContent();
        }

        [HttpGet("{id}/chat")]
        public async Task<ActionResult<GetMessagesDto>> GetLLMMessages(int id)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var (result, newToken, newRefreshToken) = await _llmService.GetLLMMessagesAsync(id, token, refreshToken);

            if (newToken != null && newRefreshToken != null)
                CookieHelper.SetTokenCookies(Response, newToken, newRefreshToken);

            return Ok(result);
        }

        [HttpPost("{id}/chat")]
        public async Task<ActionResult<MessageResponseDto>> SendMessage(int id, [FromBody] string message)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var (result, newToken, newRefreshToken) = await _llmService.SendMessageAsync(id, message, token, refreshToken);

            if (newToken != null && newRefreshToken != null)
                CookieHelper.SetTokenCookies(Response, newToken, newRefreshToken);

            return Created(string.Empty, result);
        }

        [HttpPost("{id}/chat/stream")]
        public async Task StreamMessage(int id, [FromBody] string message)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var cancellationToken = HttpContext.RequestAborted;

            try
            {
                await foreach (var streamEvent in _llmService.StreamMessageAsync(id, message, token, refreshToken, cancellationToken))
                {
                    if (streamEvent.Type == "session")
                    {
                        if (streamEvent.NewToken != null && streamEvent.NewRefreshToken != null)
                            CookieHelper.SetTokenCookies(Response, streamEvent.NewToken, streamEvent.NewRefreshToken);

                        Response.ContentType = "application/x-ndjson";
                        continue;
                    }

                    await WriteStreamEventAsync(streamEvent, cancellationToken);
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
            }
            catch (Exception ex) when (Response.HasStarted)
            {
                _logger.LogError(ex, "Streaming failed: {Message}", ex.Message);
                await WriteStreamEventAsync(
                    new StreamEventDto { Type = "error", Content = "The response was interrupted. Please try again." },
                    CancellationToken.None);
            }
        }

        private async Task WriteStreamEventAsync(StreamEventDto streamEvent, CancellationToken cancellationToken)
        {
            await Response.WriteAsync(JsonSerializer.Serialize(streamEvent, StreamJsonOptions) + "\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
        }
    }
}
