using AICall.API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AICall.API.Controllers
{
    [Route("aicall/api/[controller]")]
    [ApiController]
    public class DealController : ControllerBase
    {
        private readonly ISpeechService _speechService;
        public DealController(ISpeechService speechService)
        {
            _speechService = speechService;
        }

        // 1. 语音转文字 (ASR) FormData 上传文件时，必须用 IFormFile
        [HttpPost("speechToText")]
        [Authorize]
        public async Task<IActionResult> SpeechToText([FromForm] FileUploadDto request)
        {
            var file = request.File;
            if (file == null || file.Length == 0)
            {
                return BadRequest("没有收到音频文件");
            }

            try
            {
                string recognizedText = await _speechService.SpeechToTextAsync(file);
                var result = new
                {
                    data = recognizedText
                };
                return Ok(result);

            }
            catch (Exception ex)
            {
                return StatusCode(500, $"语音识别失败: {ex.Message}");
            }

        }
        // 2. 文本转语音 (TTS)
        [HttpGet("textToSpeech3")]
        [Authorize]
        public async Task<IActionResult> TextToSpeech([FromQuery] string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return BadRequest("文本不能为空");
            }
            try
            {
                byte[] audioBytes = await _speechService.TextToSpeechAsync(text);
                return File(audioBytes, "audio/mpeg");
            }
            catch (Exception ex) { return StatusCode(500, $"语音合成失败: {ex.Message}"); }

        }

    }
    public class FileUploadDto
    {
        public IFormFile File { get; set; }
    }
}
