using backend.Helpers;
using backend.Models.DTOs.Auth;
using backend.Models.DTOs.LLM;
using backend.Services;
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

            Response.Cookies.Append("token", token, new CookieOptions { HttpOnly = true, Secure = true, SameSite = SameSiteMode.Strict });
            Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions { HttpOnly = true, Secure = true, SameSite = SameSiteMode.Strict });

            return Created(string.Empty, result);
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
        {
            var (result, token, refreshToken) = await _authService.LoginAsync(loginDto);

            Response.Cookies.Append("token", token, new CookieOptions { HttpOnly = true, Secure = true, SameSite = SameSiteMode.Strict });
            Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions { HttpOnly = true, Secure = true, SameSite = SameSiteMode.Strict });

            return Ok(result);
        }

        [HttpGet("me")]
        public async Task<ActionResult<AuthResponseDto>> GetCurrentUser()
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            AuthResponseDto result = await _authService.GetCurrentUserAsync(token, refreshToken);
            return Ok(result);
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

        [HttpPatch("update")]
        public async Task<ActionResult<AuthResponseDto>> UpdateUser([FromBody] UpdateUserDto updateUserDto)
        {
            var (token, refreshToken) = CookieHelper.GetTokensFromCookies(Request.Cookies);
            AuthResponseDto result = await _authService.UpdateCurrentUserAsync(updateUserDto, token, refreshToken);
            return Ok(result);
        }
    }
}