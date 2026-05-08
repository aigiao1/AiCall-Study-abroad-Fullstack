using AICall.API.Dtos.Conversation;
using AICall.API.Extensions;
using AICall.API.Interfaces;
using AICall.API.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AICall.API.Controllers
{
    [Route("aicall/api/[controller]")]
    [ApiController]

    public class ConversationController : ControllerBase
    {
        private readonly ICallSessionRepository _sessionRepo;
        private readonly ILLMService _llmService;
        public ConversationController(ICallSessionRepository sessionRepo, ILLMService llmService)
        {
            _sessionRepo = sessionRepo;
            _llmService = llmService;

        }
        // 1. 聊天接口
        [HttpPost("chat")]
        [Authorize]
        public async Task<IActionResult> Chat([FromBody] ChatRequestDto request)
        {
            try
            {
                // 【调用ai聊天回复】
                string aiAnswer = await _llmService.GetChatResponseAsync(request.Conversation, request.Category, request.SceneType, request.Mode);
                var response = new
                {
                    data = new
                    {
                        response_msg = new
                        {
                            answer = aiAnswer,
                            is_end = false // 目前简单处理，默认不挂断
                        }
                    }
                };
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AI 调用失败: {ex.Message}");
                return StatusCode(500, "大模型服务异常，请查看控制台日志");
            }
        }

        // 2.新增的流式聊天接口
        [HttpPost("chat-stream")]
        [Authorize]
        public async Task ChatStream([FromBody] ChatRequestDto request)
        {

            Response.Headers.Add("Content-Type", "text/event-stream");
            Response.Headers.Add("Cache-Control", "no-cache");
            Response.Headers.Add("Connection", "keep-alive");

            try
            {

                var stream = _llmService.GetChatStreamAsync(request.Conversation, request.Category, request.SceneType, request.Mode);

                // 只要大模型吐出一个字，我们就立刻顺着网线扔给前端
                await foreach (var chunk in stream)
                {
                    // Server-Sent Events (SSE) 的国际标准格式：必须以 "data: " 开头，以两个换行符结尾
                    var formattedData = $"data: {chunk}\n\n";

                    await Response.WriteAsync(formattedData);
                    await Response.Body.FlushAsync(); // Flush 的意思就是“立刻冲水”，绝不把字留在后端的肚子里
                }

                // 大模型说完了，发一个结束信号告诉前端
                await Response.WriteAsync("data: [DONE]\n\n");
                await Response.Body.FlushAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AI 流式调用失败: {ex.Message}");
                // 如果中途报错了，把错误信息也通过流推给前端
                await Response.WriteAsync($"data: [ERROR]大模型服务异常，请查看控制台日志\n\n");
                await Response.Body.FlushAsync();
            }
        }



        // 3. 生成报告接口
        [HttpPost("report")]
        [Authorize]
        public async Task<IActionResult> GenerateReport([FromBody] ChatRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            string UserId = User.GetUserId();
            try
            {
                string rawSummary = await _llmService.GenerateSummaryAsync(request.Conversation, request.Category, request.SceneType);
                string cleanJson = rawSummary.Replace("```json", "").Replace("```", "").Trim();

                // Parse as dynamic dictionary to support all scene-specific fields
                var summaryDict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(cleanJson);
                if (summaryDict == null) throw new Exception("LLM returned unparseable JSON");

                // Build dynamic response — passes through all LLM fields + Topic
                var summaryFields = new Dictionary<string, object> { ["Topic"] = request.Category };
                foreach (var kv in summaryDict)
                {
                    summaryFields[kv.Key] = kv.Value?.ToString() ?? "";
                }

                // Store raw JSON in DB
                var sessionModel = request.ToCallSessionFromDto(cleanJson, UserId);
                await _sessionRepo.CreateSessionAsync(sessionModel);

                var finalReport = new
                {
                    data = new
                    {
                        report_msg = new { summary = summaryFields }
                    }
                };

                return Ok(finalReport);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Report generation failed: {ex.Message}");
                return StatusCode(500, "Failed to generate report, please retry");
            }
        }
    }
}
