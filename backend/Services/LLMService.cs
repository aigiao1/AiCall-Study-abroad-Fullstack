using AICall.API.Dtos.Conversation;
using AICall.API.Interfaces;
using AICall.API.Models;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace AICall.API.Services
{
    public class LLMService : ILLMService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;

        public LLMService(IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _httpClientFactory = httpClientFactory;
            _config = config;
        }

        private static string GetSystemPrompt(SceneType sceneType, string category, string? mode = null)
        {
            return sceneType switch
            {
                SceneType.MockInterview when mode == "interviewer" => $@"You are a job candidate interviewing for a [{category}] position.
The user is the interviewer. Your job:
1. Answer their questions as a competent but not perfect candidate.
2. Occasionally make a small mistake (e.g., miss a detail) so the interviewer can catch it.
3. After the session ends (user says 'thank you' or 'that concludes'), briefly rate the interviewer's questioning skills out of 10 with a short explanation.
4. Language: English only. Keep answers under 60 seconds.
5. Tone: Professional, slightly nervous but prepared.",

                SceneType.MockInterview => $@"You are a seasoned technical interviewer at a top tech company.
You are conducting a realistic voice interview for a [{category}] role.
Rules:
1. Ask ONE question at a time, wait for the candidate's answer.
2. After each answer, ask a follow-up that digs deeper into their response.
3. Tone: Professional, neutral. Never say ""Great answer!"" or ""Excellent!"" — just acknowledge briefly and move to the next question.
4. After 5-6 exchanges, say: ""That concludes our interview. Thank you for your time.""
5. Keep responses concise — this is a voice conversation.
6. Language: English only.",

                SceneType.EnglishCoach => $@"You are a friendly, encouraging English speaking coach.
Your student wants to practice: [{category}].
Rules:
1. Speak ONLY in English. Use clear, natural speech at a moderate pace.
2. After EVERY student response, do TWO things:
   a) Reply naturally to continue the conversation.
   b) Point out 1-2 grammar or pronunciation errors with corrections.
   Format errors as: [Grammar: ""incorrect"" → ""correct"" — brief explanation]
3. Be encouraging but honest. Celebrate good phrasing when you hear it.
4. Keep your replies under 40 seconds — this is a voice conversation.
5. If the student seems stuck, offer a gentle prompt or rephrase your question.",

                _ => $@"You are a highly professional, encouraging, and experienced AI Admissions Consultant.
You are currently counseling a student regarding: [{category}].

Your core instructions:
1. Language: You MUST speak exclusively in English.
2. Tone: Friendly, professional, and supportive.
3. Voice-Call Optimized: This is a real-time voice conversation. Your responses MUST be concise, conversational, and natural. DO NOT use markdown formatting, bullet points, or long complex paragraphs.
4. Interaction: Always end your response with a short, relevant question to keep the conversation flowing naturally."
            };
        }

        public async Task<string> GetChatResponseAsync(List<MessageDto> messages, string category, SceneType sceneType = SceneType.StudyAbroad)
        {
            var systemPrompt = GetSystemPrompt(sceneType, category);
            return await SendToLLMAsync(messages, systemPrompt);
        }

        public IAsyncEnumerable<string> GetChatStreamAsync(List<MessageDto> messages, string category, SceneType sceneType = SceneType.StudyAbroad)
        {
            var systemPrompt = GetSystemPrompt(sceneType, category);
            return SendToLLMStreamAsync(messages, systemPrompt);
        }

        public async Task<string> GenerateSummaryAsync(List<MessageDto> messages, string category)
        {
            var systemPrompt = $@"You are a senior study abroad data analyst.
Please extract key information from the following consultation dialogue and output a summary strictly in JSON format.
Do not output any Markdown formatting (such as ```json), only output a pure JSON string.
The JSON must include the following fields. If any information is not mentioned in the dialogue, fill in 'Not mentioned':
{{
""background"": ""Summarize the student's academic background (school, GPA, language scores, etc.)"",
""intention"": ""Summarize the study abroad goals (country, degree, major, etc.)"",
""needs"": ""Summarize the core needs (e.g., unsure how to choose schools, no ideas for personal statements)"",
""followUp"": ""Suggested next steps""
}}";

            string rawSummary = await SendToLLMAsync(messages, systemPrompt);
            return rawSummary;
        }

        private async Task<string> SendToLLMAsync(List<MessageDto> messages, string systemPrompt)
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
                temperature = 0.7
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            string finalUrl = $"{baseUrl.TrimEnd('/')}/chat/completions";
            using var response = await client.PostAsync(finalUrl, jsonContent);

            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                throw new Exception($"LLM request failed: {response.StatusCode}, detail: {errorMsg}");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(responseString);

            var answer = document.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return answer ?? "AI returned no content";
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
                stream = true
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            string finalUrl = $"{baseUrl.TrimEnd('/')}/chat/completions";

            var request = new HttpRequestMessage(HttpMethod.Post, finalUrl)
            {
                Content = jsonContent
            };

            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                throw new Exception($"Stream request failed: {response.StatusCode}, detail: {errorMsg}");
            }

            using var stream = await response.Content.ReadAsStreamAsync();
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync();

                if (string.IsNullOrWhiteSpace(line)) continue;

                if (line.StartsWith("data: "))
                {
                    var dataStr = line.Substring(6).Trim();

                    if (dataStr == "[DONE]")
                    {
                        break;
                    }

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
                // Ignore JSON parse errors for malformed chunks
            }

            return null;
        }
    }
}
