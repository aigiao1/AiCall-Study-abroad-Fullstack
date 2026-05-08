using AICall.API.Extensions;
using AICall.API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AICall.API.Controllers
{
    [Route("aicall/api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ICallSessionRepository _sessionRepo;
        public DashboardController(ICallSessionRepository sessionRepo)
        {
            _sessionRepo = sessionRepo;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var userId = User.GetUserId();
            var stats = await _sessionRepo.GetDashboardStatsAsync(userId);
            return Ok(new { data = stats });
        }
    }
}
