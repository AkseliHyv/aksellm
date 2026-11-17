using System.Text.Json;
using System.Text.Json.Serialization;
using backend.Helpers;
using backend.Models.DTOs.LLM;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting(RateLimitHelper.General)]
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
            return Ok(await _llmService.GetAllLLMsAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LLMResponseDto>> GetLLMById(int id)
        {
            return Ok(await _llmService.GetLLMByIdAsync(id));
        }

        [HttpPost]
        public async Task<ActionResult<LLMResponseDto>> CreateLLM([FromBody] CreateLLMDto createLLMDto)
        {
            return Created(string.Empty, await _llmService.CreateLLMAsync(createLLMDto));
        }

        [HttpPatch("{id}")]
        public async Task<ActionResult<LLMResponseDto>> UpdateLLM(int id, [FromBody] UpdateLLMDto updateLLMDto)
        {
            return Ok(await _llmService.UpdateLLMAsync(id, updateLLMDto));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLLM(int id)
        {
            await _llmService.DeleteLLMAsync(id);
            return NoContent();
        }

        [HttpGet("{id}/chat")]
        public async Task<ActionResult<GetMessagesDto>> GetLLMMessages(int id)
        {
            return Ok(await _llmService.GetLLMMessagesAsync(id));
        }

        [EnableRateLimiting(RateLimitHelper.Chat)]
        [HttpPost("{id}/chat")]
        public async Task<ActionResult<MessageResponseDto>> SendMessage(int id, [FromBody] string message)
        {
            return Created(string.Empty, await _llmService.SendMessageAsync(id, message));
        }

        [EnableRateLimiting(RateLimitHelper.Chat)]
        [HttpPost("{id}/chat/stream")]
        public async Task StreamMessage(int id, [FromBody] string message)
        {
            var cancellationToken = HttpContext.RequestAborted;

            try
            {
                await foreach (var streamEvent in _llmService.StreamMessageAsync(id, message, cancellationToken))
                {
                    if (streamEvent.Type == "start")
                    {
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
