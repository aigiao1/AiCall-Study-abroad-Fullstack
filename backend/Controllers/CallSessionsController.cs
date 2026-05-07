using AICall.API.Dtos.Conversation;
using AICall.API.Extensions;
using AICall.API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AICall.API.Controllers
{
    [Route("aicall/api/[controller]")]
    [ApiController]
    [Authorize]
    public class CallSessionsController : ControllerBase
    {
        private readonly ICallSessionRepository _sessionRepo;
        public CallSessionsController(ICallSessionRepository sessionRepo)
        {
            _sessionRepo = sessionRepo;
        }

        // 1. 获取会话列表 (支持分页和筛选)  
        [HttpGet]
        public async Task<IActionResult> GetSessions([FromQuery] CallSessionQueryObject query)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            string userId = User.GetUserId();
            var pagedResult = await _sessionRepo.GetSessionsAsync(query, userId);
            return Ok(new { data = pagedResult });
        }
        // 2. 获取单个会话详情 (包含详细的聊天记录)
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetSessionById([FromRoute] int id)
        {
            string userId = User.GetUserId();

            // 拿到包含 Messages 的完整实体
            var session = await _sessionRepo.GetSessionByIdAsync(id, userId);

            if (session == null)
            {
                return NotFound(new { message = "未找到该通话记录或无权访问" });
            }
            // 为什么不直接 return Ok(session)？
            // 因为 CallSession 里有 Messages，Messages 里又指回了 CallSession (爸爸找儿子，儿子找爸爸)，
            // 直接返回会导致 JSON 序列化时发生“无限循环(Object Cycle)”报错。
            var responseData = new
            {
                id = session.Id,
                startTime = session.StartTime,
                endTime = session.EndTime,
                category = session.Category,
                subCategory = session.SubCategory,
                summary = session.Summary, // 这里可以直接返回你存进去的 JSON 字符串
                messages = session.Messages?.Select(m => new
                {
                    id = m.Id,
                    role = m.Role,
                    content = m.Content,
                    timestamp = m.Timestamp
                }).ToList()
            };

            return Ok(new { data = responseData });
        }

        // 3. 删除某个会话
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSession(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var deleted = await _sessionRepo.DeleteSessionAsync(id, userId);
            if (!deleted) return NotFound();

            return NoContent();
        }
    }
}

