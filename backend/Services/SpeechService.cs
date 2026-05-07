using AICall.API.Interfaces;
using System.Net.Http.Headers;
using System.Text.Json;

namespace AICall.API.Services
{
    public class SpeechService : ISpeechService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<SpeechService> _logger;

        public SpeechService(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<SpeechService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _config = config;
            _logger = logger;
        }

        // 1. 语音转文字 (Whisper API)
        public async Task<string> SpeechToTextAsync(IFormFile file)
        {
            var apiKey = _config["ASR:ApiKey"];
            var baseUrl = _config["ASR:BaseUrl"];
            var model = _config["ASR:ModelName"];

            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            // 【核心：构建 FormData 表单数据】
            using var content = new MultipartFormDataContent();

            // 读取文件流（确保正确释放）
            await using var fileStream = file.OpenReadStream();
            using var fileContent = new StreamContent(fileStream);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType ?? "audio/webm");

            content.Add(fileContent, "file", file.FileName);
            content.Add(new StringContent(model!), "model");
            content.Add(new StringContent("en"), "language");


            // 发送请求到 OpenAI 的 transcriptions 接口
            using var response = await client.PostAsync($"{baseUrl}audio/transcriptions", content);

            var status = response.StatusCode;
            var mediaType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
            _logger.LogInformation("ASR response status: {Status}, content-type: {ContentType}", status, mediaType);

            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("ASR request failed. Status: {Status}, BodySnippet: {Snippet}", status, errorMsg?.Length > 500 ? errorMsg.Substring(0, 500) : errorMsg);
                throw new Exception($"语音识别失败: 状态码 {status}, 详情请查看服务端日志");
            }

            // 如果返回的不是 JSON（例如 HTML 错误页或二进制），记录并抛出更清晰的错误
            if (!mediaType.Contains("json", StringComparison.OrdinalIgnoreCase))
            {
                // 读取为字符串尝试记录可读片段；若为二进制则可能是乱码，但仍记录长度
                string maybeText;
                try
                {
                    maybeText = await response.Content.ReadAsStringAsync();
                }
                catch (Exception ex)
                {
                    var bytes = await response.Content.ReadAsByteArrayAsync();
                    _logger.LogError(ex, "ASR returned non-text content. Content-Type: {ContentType}, byteLength: {Len}", mediaType, bytes.Length);
                    throw new Exception($"语音识别返回非 JSON 内容 (Content-Type={mediaType})，详情请查看服务端日志");
                }

                _logger.LogError("ASR returned unexpected content-type {ContentType}. Snippet: {Snippet}", mediaType, maybeText?.Length > 500 ? maybeText.Substring(0, 500) : maybeText);
                throw new Exception($"语音识别返回非 JSON 内容 (Content-Type={mediaType})，详情请查看服务端日志");
            }

            var responseString = await response.Content.ReadAsStringAsync();

            try
            {
                using var document = JsonDocument.Parse(responseString);
                var text = document.RootElement.GetProperty("text").GetString();
                return text ?? string.Empty;
            }
            catch (JsonException jex)
            {
                _logger.LogError(jex, "Failed to parse ASR JSON. Snippet: {Snippet}", responseString?.Length > 500 ? responseString.Substring(0, 500) : responseString);
                throw new Exception($"语音识别返回的数据无法解析为 JSON，详情请查看服务端日志");
            }
        }

        // 2. 文字转语音 (OpenAI TTS API)
        public async Task<byte[]> TextToSpeechAsync(string text)
        {
            // 防御性截断，避免单次合成文本过长导致超时
            if (text.Length > 1000) text = text.Substring(0, 1000);

            var apiKey = _config["TTS:ApiKey"];
            var baseUrl = _config["TTS:BaseUrl"];
            var model = _config["TTS:ModelName"];
            var voice = _config["TTS:Voice"];

            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var requestBody = new
            {
                model = model,
                input = text,
                voice = voice,
                response_format = "mp3"
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), System.Text.Encoding.UTF8, "application/json");
            try
            {
                _logger.LogInformation("准备发送请求，目标URL: {Url}", $"{baseUrl}audio/speech");

                // 2. 发送请求
                using var response = await client.PostAsync($"{baseUrl}audio/speech", jsonContent);

                _logger.LogInformation("请求执行完毕！状态码: {StatusCode}", response.StatusCode);

                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    throw new Exception($"TTS 合成失败: {response.StatusCode}, {errorMsg}");
                }

                return await response.Content.ReadAsByteArrayAsync();
            }
            catch (TaskCanceledException)
            {
                // 3. 捕捉超时异常
                _logger.LogError("网络请求超时！C# 程序连不上 {BaseUrl}", baseUrl);
                throw new Exception("语音服务器连接超时，请检查后端的网络或代理设置！");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "发生未知错误");
                throw;
            }
        }
    }
}