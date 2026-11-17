using backend.Helpers;
using backend.Models.DTOs.Auth;
using backend.Models.DTOs.LLM;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto registerDto)
        {
            var (result, token, refreshToken) = await _authService.RegisterAsync(registerDto);
            CookieHelper.SetTokenCookies(Response, token, refreshToken);
            return Created(string.Empty, result);
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
        {
            var (result, token, refreshToken) = await _authService.LoginAsync(loginDto);
            CookieHelper.SetTokenCookies(Response, token, refreshToken);
            return Ok(result);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<AuthResponseDto>> GetCurrentUser()
        {
            return Ok(await _authService.GetCurrentUserAsync());
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            await _authService.LogoutAsync(token, refreshToken);

            Response.Cookies.Delete("token");
            Response.Cookies.Delete("refreshToken");

            return NoContent();
        }

        [Authorize]
        [HttpPatch("update")]
        public async Task<ActionResult<AuthResponseDto>> UpdateUser([FromBody] UpdateUserDto updateUserDto)
        {
            return Ok(await _authService.UpdateCurrentUserAsync(updateUserDto));
        }
    }
}