using AICall.API.Dtos.Conversation;
using AICall.API.Interfaces;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace AICall.API.Services
{
    public class LLMService : ILLMService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;

        // 【核心掌握：依赖注入 HttpClientFactory】
        // 绝不要直接 new HttpClient()，这会导致系统底层的 Socket 端口耗尽而崩溃。
        public LLMService(IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _httpClientFactory = httpClientFactory;
            _config = config;
        }

        // 1. 获取聊天回复
        public async Task<string> GetChatResponseAsync(List<MessageDto> messages, string category)
        {
            var systemPrompt = $@"You are a highly professional, encouraging, and experienced AI Admissions Consultant. 
You are currently counseling a student regarding: [{category}].

Your core instructions:
1. Language: You MUST speak exclusively in English.
2. Tone: Friendly, professional, and supportive.
3. Voice-Call Optimized: This is a real-time voice conversation. Your responses MUST be concise, conversational, and natural. DO NOT use markdown formatting, bullet points, or long complex paragraphs.
4. Interaction: Always end your response with a short, relevant question to keep the conversation flowing naturally.";

            return await SendToLLMAsync(messages, systemPrompt);
        }


        //生成总结报告（返回原始 JSON 字符串，由调用方负责清理与解析）
        public async Task<string> GenerateSummaryAsync(List<MessageDto> messages, string category)
        {
            var systemPrompt = $@"You are a senior study abroad data analyst.
Please extract key information from the following consultation dialogue and output a summary strictly in JSON format.
Do not output any Markdown formatting (such as ```json), only output a pure JSON string.
The JSON must include the following fields. If any information is not mentioned in the dialogue, fill in 'Not mentioned':
{{
""background"": ""Summarize the student’s academic background (school, GPA, language scores, etc.)"",
""intention"": ""Summarize the study abroad goals (country, degree, major, etc.)"",
""needs"": ""Summarize the core needs (e.g., unsure how to choose schools, no ideas for personal statements)"",
""followUp"": ""Suggested next steps""
}}";

            string rawSummary = await SendToLLMAsync(messages, systemPrompt);
            return rawSummary;
        }

        // 【核心内功：私有方法统一处理网络通信】
        private async Task<string> SendToLLMAsync(List<MessageDto> messages, string systemPrompt)
        {
            var apiKey = _config["LLM:ApiKey"];
            var baseUrl = _config["LLM:BaseUrl"];
            var modelName = _config["LLM:ModelName"];

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            // 1. 构建 OpenAI 标准格式的请求体
            var openAiMessages = new List<object>
            {
                new { role = "system", content = systemPrompt }
            };

            // 【核心动作：角色翻译】 salesman -> assistant, customer -> user
            foreach (var msg in messages)
            {
                string standardRole = msg.Role.ToLower() == "salesman" ? "assistant" : "user";
                openAiMessages.Add(new { role = standardRole, content = msg.Content });
            }

            var requestBody = new
            {
                model = modelName,
                messages = openAiMessages,
                temperature = 0.7 // 控制回答的随机性
            };
            //转化成json格式的字符串内容，并指定编码和媒体类型
            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            // 2. 发送真实的 HTTP POST 请求到大模型厂商
            // 注意：OpenAI 标准的对话路径通常以 chat/completions 结尾
            string finalUrl = $"{baseUrl.TrimEnd('/')}/chat/completions";
            using var response = await client.PostAsync(finalUrl, jsonContent);

            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                throw new Exception($"大模型请求失败: 状态码 {response.StatusCode}, 详情: {errorMsg}");
            }

            // 3. 解析返回的 JSON 结果
            var responseString = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(responseString);

            // OpenAI 格式提取路径：choices[0].message.content
            var answer = document.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return answer ?? "AI 没有返回内容";
        }

        public async IAsyncEnumerable<string> GetChatStreamAsync(List<MessageDto> messages, string category)
        {
            var systemPrompt = $@"You are a highly professional, encouraging, and experienced AI Admissions Consultant. 
You are currently counseling a student regarding: [{category}].

Your core instructions:
1. Language: You MUST speak exclusively in English.
2. Tone: Friendly, professional, and supportive.
3. Voice-Call Optimized: This is a real-time voice conversation. Your responses MUST be concise, conversational, and natural. DO NOT use markdown formatting, bullet points, or long complex paragraphs.
4. Interaction: Always end your response with a short, relevant question to keep the conversation flowing naturally.";
            // 循环接收底层吐出来的每一个字，并继续向上（交给 Controller）吐出
            await foreach (var chunk in SendToLLMStreamAsync(messages, systemPrompt))
            {
                if (!string.IsNullOrEmpty(chunk))
                {
                    yield return chunk;
                }
            }
        }
        private async IAsyncEnumerable<string> SendToLLMStreamAsync(List<MessageDto> messages, string systemPrompt)
        {
            var apiKey = _config["LLM:ApiKey"];
            var baseUrl = _config["LLM:BaseUrl"];
            var modelName = _config["LLM:ModelName"];

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var openAiMessages = new List<object>
            {
                new { role = "system", content = systemPrompt }
            };

            foreach (var msg in messages)
            {
                string standardRole = msg.Role.ToLower() == "salesman" ? "assistant" : "user";
                openAiMessages.Add(new { role = standardRole, content = msg.Content });
            }

            var requestBody = new
            {
                model = modelName,
                messages = openAiMessages,
                temperature = 0.7,
                stream = true // 【魔法 1：开启大模型端的流式开关】
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            string finalUrl = $"{baseUrl.TrimEnd('/')}/chat/completions";

            // 构造请求对象
            var request = new HttpRequestMessage(HttpMethod.Post, finalUrl)
            {
                Content = jsonContent
            };

            // 【魔法 2：ResponseHeadersRead 告诉 HttpClient 拿到响应头就立刻返回，不要等内容下完】
            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                throw new Exception($"流式请求失败: 状态码 {response.StatusCode}, 详情: {errorMsg}");
            }

            // 获取数据流
            using var stream = await response.Content.ReadAsStreamAsync();
            using var reader = new StreamReader(stream);

            // 持续读取，直到流结束
            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync();

                if (string.IsNullOrWhiteSpace(line)) continue;

                // Server-Sent Events (SSE) 协议的标准：数据行必须以 "data: " 开头
                if (line.StartsWith("data: "))
                {
                    // 截取掉 "data: " 前缀，拿到纯 JSON 字符串
                    var dataStr = line.Substring(6).Trim();

                    // 约定俗成的结束标志
                    if (dataStr == "[DONE]")
                    {
                        break;
                    }

                    // 调用不含 yield 的辅助方法解析并返回可能的 chunk
                    var chunk = TryExtractChunkFromData(dataStr);
                    if (!string.IsNullOrEmpty(chunk))
                    {
                        yield return chunk;
                    }
                }
            }
        }

        private string? TryExtractChunkFromData(string dataStr)
        {
            try
            {
                using var document = JsonDocument.Parse(dataStr);
                var choices = document.RootElement.GetProperty("choices");

                if (choices.GetArrayLength() > 0)
                {
                    var delta = choices[0].GetProperty("delta");

                    if (delta.TryGetProperty("content", out var contentElement))
                    {
                        var chunk = contentElement.GetString();
                        if (!string.IsNullOrEmpty(chunk))
                        {
                            return chunk;
                        }
                    }
                }
            }
            catch (JsonException)
            {
                // JSON 解析异常：忽略，返回 null 表示无可用 chunk
            }

            return null;
        }
    }
}