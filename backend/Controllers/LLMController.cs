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
        private readonly ILLMService _llmService;

        public LLMController(ILLMService llmService)
        {
            _llmService = llmService;
        }

        [HttpGet]
        public async Task<ActionResult<LLMResponseDto>> GetAllLLMs()
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var result = await _llmService.GetAllLLMsAsync(token, refreshToken);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LLMResponseDto>> GetLLMById(int id)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var result = await _llmService.GetLLMByIdAsync(id, token, refreshToken);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<LLMResponseDto>> CreateLLM([FromBody] CreateLLMDto createLLMDto)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var result = await _llmService.CreateLLMAsync(createLLMDto, token, refreshToken);
            return Created(string.Empty, result);
        }

        [HttpPatch("{id}")]
        public async Task<ActionResult<LLMResponseDto>> UpdateLLM(int id, [FromBody] UpdateLLMDto updateLLMDto)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var result = await _llmService.UpdateLLMAsync(id, updateLLMDto, token, refreshToken);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLLM(int id)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            await _llmService.DeleteLLMAsync(id, token, refreshToken);
            return NoContent();
        }

        [HttpGet("{id}/chat")]
        public async Task<ActionResult<GetMessagesDto>> GetLLMMessages(int id)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var result = await _llmService.GetLLMMessagesAsync(id, token, refreshToken);
            return Ok(result);
        }

        [HttpPost("{id}/chat")]
        public async Task<ActionResult<MessageResponseDto>> SendMessage(int id, [FromBody] string message)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            var result = await _llmService.SendMessageAsync(id, message, token, refreshToken);
            return Created(string.Empty, result);
        }
    }
}