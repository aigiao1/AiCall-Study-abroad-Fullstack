# Scenario Switcher + Voice Waveform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the single-purpose study-abroad advisor into a 3-scenario AI platform with real-time voice waveform visualization.

**Architecture:** Backend adds a `SceneType` enum and refactors `LLMService` to select from 4 distinct System Prompts (StudyAbroad, Interview-interviewee, Interview-interviewer, EnglishCoach). Frontend gets a redesigned 3-card HomeView, 3 new detail pages (each with unique theme), a Canvas-based WaveformVisualizer, and updated routing.

**Tech Stack:** .NET 8 + EF Core (backend), Vue 3 + Vite + Tailwind CSS v4 + Canvas API (frontend)

---

### Task 1: Create SceneType Enum

**Files:**
- Create: `backend/Models/SceneType.cs`

- [ ] **Step 1: Create the enum file**

```csharp
namespace AICall.API.Models
{
    public enum SceneType
    {
        StudyAbroad = 1,
        MockInterview = 2,
        EnglishCoach = 3
    }
}
```

- [ ] **Step 2: Verify build**

Run: `dotnet build backend/AICall.API.csproj`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add backend/Models/SceneType.cs
git commit -m "feat: add SceneType enum for scenario switching"
```

---

### Task 2: Update ChatRequestDto with SceneType

**Files:**
- Modify: `backend/Dtos/Conversation/ChatRequestDto.cs`

- [ ] **Step 1: Add SceneType field**

```csharp
using AICall.API.Models;

namespace AICall.API.Dtos.Conversation
{
    public class ChatRequestDto
    {
        public List<MessageDto> Conversation { get; set; } = new();
        public string Category { get; set; } = string.Empty;
        public string Sub_Category { get; set; } = string.Empty;
        public SceneType SceneType { get; set; } = SceneType.StudyAbroad;
    }
}
```

- [ ] **Step 2: Verify build**

Run: `dotnet build backend/AICall.API.csproj`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add backend/Dtos/Conversation/ChatRequestDto.cs
git commit -m "feat: add SceneType field to ChatRequestDto"
```

---

### Task 3: Update CallSession Entity + Migration

**Files:**
- Modify: `backend/Models/CallSession.cs`

- [ ] **Step 1: Add SceneType field to CallSession**

```csharp
namespace AICall.API.Models
{
    public class CallSession
    {
        public int Id { get; set; }
        public string? AppUserId { get; set; }
        public AppUser AppUser { get; set; }
        public DateTime? StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }
        public string? Category { get; set; } = string.Empty;
        public string? SubCategory { get; set; } = string.Empty;
        public string? Summary { get; set; } = string.Empty;
        public SceneType SceneType { get; set; } = SceneType.StudyAbroad;
        public List<CallMessage>? Messages { get; set; } = new List<CallMessage>();
    }
}
```

- [ ] **Step 2: Create EF migration**

Run: `dotnet ef migrations add AddSceneTypeToCallSession --project backend/AICall.API.csproj`
Expected: Migration file created under `backend/Migrations/`.

- [ ] **Step 3: Apply migration**

Run: `dotnet ef database update --project backend/AICall.API.csproj`
Expected: Database updated successfully.

- [ ] **Step 4: Commit**

```bash
git add backend/Models/CallSession.cs backend/Migrations/
git commit -m "feat: add SceneType field to CallSession entity with migration"
```

---

### Task 4: Update ILLMService Interface

**Files:**
- Modify: `backend/Interfaces/ILLMService.cs`

- [ ] **Step 1: Add SceneType parameters**

```csharp
using AICall.API.Dtos.Conversation;
using AICall.API.Models;

namespace AICall.API.Interfaces
{
    public interface ILLMService
    {
        Task<string> GetChatResponseAsync(List<MessageDto> messages, string category, SceneType sceneType = SceneType.StudyAbroad);

        Task<string> GenerateSummaryAsync(List<MessageDto> messages, string category);

        IAsyncEnumerable<string> GetChatStreamAsync(List<MessageDto> messages, string category, SceneType sceneType = SceneType.StudyAbroad);
    }
}
```

- [ ] **Step 2: Verify build** (will fail until Task 5 updates LLMService)

Run: `dotnet build backend/AICall.API.csproj`
Expected: Build errors in LLMService.cs (does not implement updated interface).

- [ ] **Step 3: Commit**

```bash
git add backend/Interfaces/ILLMService.cs
git commit -m "feat: add SceneType parameter to ILLMService methods"
```

---

### Task 5: Refactor LLMService with Scene-Based Prompts

**Files:**
- Modify: `backend/Services/LLMService.cs`

- [ ] **Step 1: Add the prompt selection method and update all methods**

Replace the entire file:

```csharp
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
```

- [ ] **Step 2: Verify build**

Run: `dotnet build backend/AICall.API.csproj`
Expected: Build succeeded with no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/Services/LLMService.cs
git commit -m "feat: refactor LLMService with scene-based System Prompt selection"
```

---

### Task 6: Update ConversationController and Mappers

**Files:**
- Modify: `backend/Controllers/ConversationController.cs`
- Modify: `backend/Mappers/ConversationMappers.cs`

- [ ] **Step 1: Update ConversationController to pass SceneType**

In `ConversationController.cs`, update the three methods that call LLMService:

Line 31 — `Chat` method:
```csharp
string aiAnswer = await _llmService.GetChatResponseAsync(request.Conversation, request.Category, request.SceneType);
```

Line 65 — `ChatStream` method:
```csharp
var stream = _llmService.GetChatStreamAsync(request.Conversation, request.Category, request.SceneType);
```

Line 105 — `GenerateReport` method (no change needed since SummaryAsync doesn't need SceneType, but the mapper needs it):

- [ ] **Step 2: Update ConversationMappers to map SceneType**

In `ConversationMappers.cs`, add SceneType mapping inside `ToCallSessionFromDto`:

```csharp
var session = new CallSession
{
    AppUserId = userId,
    Category = requestDto.Category,
    SubCategory = requestDto.Sub_Category,
    SceneType = requestDto.SceneType,
    Summary = generatedSummary,
    StartTime = DateTime.Now,
    EndTime = DateTime.Now,
    Messages = new List<CallMessage>()
};
```

- [ ] **Step 3: Verify build**

Run: `dotnet build backend/AICall.API.csproj`
Expected: Build succeeded.

- [ ] **Step 4: Commit**

```bash
git add backend/Controllers/ConversationController.cs backend/Mappers/ConversationMappers.cs
git commit -m "feat: wire SceneType through ConversationController and Mappers"
```

---

### Task 7: Update Frontend Router

**Files:**
- Modify: `frontend/src/router/index.js`

- [ ] **Step 1: Add imports for 3 new views**

```js
import StudyAbroadView from "../views/StudyAbroadView.vue";
import InterviewView from "../views/InterviewView.vue";
import EnglishCoachView from "../views/EnglishCoachView.vue";
```

- [ ] **Step 2: Add 3 new routes**

Add after the `/home` route:

```js
{
  path: "/study-abroad",
  name: "StudyAbroad",
  component: StudyAbroadView,
  meta: { requiresAuth: true },
},
{
  path: "/interview",
  name: "Interview",
  component: InterviewView,
  meta: { requiresAuth: true },
},
{
  path: "/english-coach",
  name: "EnglishCoach",
  component: EnglishCoachView,
  meta: { requiresAuth: true },
},
```

- [ ] **Step 3: Verify dev server starts**

Run: `pnpm dev` (will auto-install missing component stubs)
Expected: No fatal errors (warnings about unresolved imports are fine until pages are created).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/router/index.js
git commit -m "feat: add routes for study-abroad, interview, english-coach pages"
```

---

### Task 8: Update Frontend LLM Service and Chat Stream to Pass SceneType

**Files:**
- Modify: `frontend/src/utils/llm.js`
- Modify: `frontend/src/composables/useSSEChatStream.js` (the requestBody is built in chatroom.vue)

- [ ] **Step 1: Update LLMServer.chat() to accept and pass sceneType**

In `frontend/src/utils/llm.js`, add `sceneType` parameter:

```js
async chat(messages, category, subCategory, sceneType = 1) {
  const result = await apiLlmChat({
    conversation: messages.map(x => ({ role: x.role, content: x.content })),
    category,
    sub_category: subCategory,
    sceneType
  });
  // ... rest unchanged
},

async generateReport(messages, category, subCategory, sceneType = 1) {
  const result = await apiGenerateReport({
    conversation: messages.map(x => ({ role: x.role, content: x.content })),
    category,
    sub_category: subCategory,
    sceneType
  });
  // ... rest unchanged
},
```

**Note:** `apiLlmChat` and `apiGenerateReport` in `api/index.js` pass the data object directly to `request.post()` — no changes needed since `sceneType` is just a new property on the same data object.

- [ ] **Step 2: Add sceneType to SSE chat-stream request body**

The SSE stream uses `fetchChatStream(requestBody, ...)` where `requestBody` is built in `chatroom.vue`. The `sceneType` field is already serialized in the JSON body when we add it there (see Task 13).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/utils/llm.js
git commit -m "feat: pass sceneType parameter through LLMServer and API calls"
```

---

### Task 9: Redesign HomeView with 3 Scenario Cards

**Files:**
- Rewrite: `frontend/src/views/HomeView.vue`

- [ ] **Step 1: Replace HomeView with scenario card layout**

```vue
<script setup>
import { useRouter } from "vue-router";
import { BarChart3, History, GraduationCap, UserCheck, Globe, ArrowRight } from "lucide-vue-next";

const router = useRouter();

const scenarios = [
  {
    id: "study-abroad",
    icon: GraduationCap,
    title: "Study Abroad\nAdvisor",
    desc: "School selection · Academics · Budget · Visa",
    gradient: "from-sky-50 to-blue-50",
    border: "border-sky-200/60",
    accent: "text-sky-600",
    badge: "bg-sky-100 text-sky-700",
    route: "/study-abroad",
  },
  {
    id: "interview",
    icon: UserCheck,
    title: "Mock\nInterview",
    desc: "Be interviewed · Interview others · Practice mode",
    gradient: "from-amber-50 to-yellow-50",
    border: "border-amber-200/60",
    accent: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    route: "/interview",
  },
  {
    id: "english",
    icon: Globe,
    title: "English\nCoach",
    desc: "Roleplay · Grammar fix · Free conversation",
    gradient: "from-emerald-50 to-green-50",
    border: "border-emerald-200/60",
    accent: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    route: "/english-coach",
  },
];

const goDashboard = () => router.push({ name: "Dashboard" });
const goHistory = () => router.push({ name: "HistoryList" });
</script>

<template>
  <div class="min-h-[100dvh] px-3 pb-3 pt-3">
    <div class="space-y-3">
      <header class="neo-raised rounded-[28px] px-4 py-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-700/70">
              AI Concierge
            </p>
            <h1 class="mt-2 font-[var(--font-display)] text-[2.95rem] font-semibold leading-[0.88] tracking-[0.01em] text-slate-900">
              Choose a
            </h1>
            <p class="font-[var(--font-display)] text-[2rem] leading-none text-slate-900/92">
              Service
            </p>
            <p class="mt-2.5 max-w-[15rem] text-[14px] leading-7 text-slate-500">
              Select an AI assistant and start your voice session.
            </p>
          </div>
          <div class="shrink-0 rounded-[24px] bg-white/82 p-2 shadow-[0_12px_28px_rgba(148,163,184,0.12)]">
            <img src="../assets/image/robot.png" alt="AI Robot" class="h-16 w-16 rounded-[18px] object-cover" />
          </div>
        </div>
      </header>

      <section class="space-y-3">
        <button
          v-for="s in scenarios"
          :key="s.id"
          type="button"
          @click="router.push(s.route)"
          class="neo-raised flex w-full items-center gap-4 rounded-[24px] p-4 text-left transition-all active:scale-[0.98] active:neo-inset"
          :class="`bg-gradient-to-br ${s.gradient} border ${s.border}`"
        >
          <span class="neo-icon-box flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]" :class="s.accent">
            <component :is="s.icon" :size="22" stroke-width="1.5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-[18px] font-bold leading-tight text-slate-800 whitespace-pre-line">{{ s.title }}</span>
            <span class="mt-1 block text-[12px] text-slate-500">{{ s.desc }}</span>
          </span>
          <ArrowRight :size="18" stroke-width="1.5" class="shrink-0 text-slate-300" />
        </button>
      </section>

      <div class="flex items-center gap-2.5">
        <button type="button" @click="goDashboard" class="neo-raised flex h-9 flex-1 items-center justify-center gap-2 rounded-full px-3.5 text-xs font-semibold text-sky-600 transition-all active:scale-95">
          <BarChart3 :size="14" stroke-width="2" class="text-sky-500" />
          <span>Dashboard</span>
        </button>
        <button type="button" @click="goHistory" class="neo-raised flex h-9 flex-1 items-center justify-center gap-2 rounded-full px-3.5 text-xs font-semibold text-slate-600 transition-all active:scale-95">
          <History :size="14" stroke-width="2" class="text-slate-400" />
          <span>History</span>
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/HomeView.vue
git commit -m "feat: redesign HomeView with 3 scenario entry cards"
```

---

### Task 10: Create StudyAbroadView

**Files:**
- Create: `frontend/src/views/StudyAbroadView.vue`

- [ ] **Step 1: Create the page by migrating logic from the old HomeView**

This page takes the old HomeView's category/sub-category selection logic and wraps it in a new page with the academic blue-white theme and back navigation.

```vue
<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowRight, ArrowLeft, Mic, School, GraduationCap, Wallet, Languages,
} from "lucide-vue-next";
import { CONFIG } from "../utils/config.js";
import { VoiceRecognizerWithVAD } from "../utils/voiceRecognizer.js";
import { globalAudioManager } from "../utils/audioManager.js";
import { notify } from "../utils/toast.js";

const iconMap = {
  taocan: School,
  zhineng: GraduationCap,
  heyue: Wallet,
  weixi: Languages,
};

const router = useRouter();

const activeLevel1Id = ref("level1_01");
const activeLevel2Id = ref("level2_01_01");

const categoryData = ref([
  {
    id: "level1_01",
    title: "School & Major\nSelection",
    iconType: "taocan",
    subCategories: [
      { id: "level2_01_01", title: "Country & School Tier", speechText: "Hello, I am your admissions consultant. To help match you with the right schools, which country are you targeting and what is your current academic background?" },
      { id: "level2_01_02", title: "Major Analysis", speechText: "Hi there! Choosing the right major is crucial. Are you looking into business, STEM, or humanities? Please tell me about your current major." },
      { id: "level2_01_03", title: "Rankings vs. Employment", speechText: "Hello! When evaluating universities, do you prioritize overall QS rankings, or are you more focused on specific program rankings and local job opportunities?" },
    ],
  },
  {
    id: "level1_02",
    title: "Academic\nRequirements",
    iconType: "zhineng",
    subCategories: [
      { id: "level2_02_01", title: "GPA & Transcripts", speechText: "Hello! GPA is a key factor in applications. Could you share your current GPA? If there are any low grades, we can figure out a strategy to address them." },
      { id: "level2_02_02", title: "Language & Test Scores", speechText: "Hi! Have you taken the IELTS, TOEFL, or GRE yet? If not, when are you planning to take these exams?" },
      { id: "level2_02_03", title: "Cross-Major Application", speechText: "Welcome! Are you looking to change your major for your master's degree? Please tell me your current major and the one you wish to pivot to." },
    ],
  },
  {
    id: "level1_03",
    title: "Budget &\nScholarships",
    iconType: "heyue",
    subCategories: [
      { id: "level2_03_01", title: "Overall Budget", speechText: "Hello! Let's talk about budget. Including tuition and living expenses, what is your estimated total budget for studying abroad?" },
      { id: "level2_03_02", title: "Cost by Country", speechText: "Hi! Costs vary greatly by country. For instance, the US and UK are generally more expensive than Asian or European options. Do you have a preference?" },
      { id: "level2_03_03", title: "Scholarship Planning", speechText: "Hello! If you're aiming for scholarships, we need to highlight your strengths. Do you have any standout research, competitions, or work experience?" },
    ],
  },
  {
    id: "level1_04",
    title: "Pre-departure\n& Future",
    iconType: "weixi",
    subCategories: [
      { id: "level2_04_01", title: "Visa Guidance", speechText: "Hi! For the visa application, you will need proof of funds. When will your bank statement and deposit be ready?" },
      { id: "level2_04_02", title: "Accommodation", speechText: "Hello! Regarding living arrangements, do you prefer applying for on-campus housing or renting a student apartment off-campus?" },
      { id: "level2_04_03", title: "Post-Grad Work Visas", speechText: "Hi! It's great to think ahead. Are you planning to seek employment and stay in the host country after graduation, or return home immediately?" },
    ],
  },
]);

const handleLevel1Click = (item) => {
  activeLevel1Id.value = item.id;
  if (item.subCategories && item.subCategories.length > 0) {
    activeLevel2Id.value = item.subCategories[0].id;
  }
};

const currentSubCategories = computed(() => {
  const activeCategory = categoryData.value.find((cat) => cat.id === activeLevel1Id.value);
  return activeCategory ? activeCategory.subCategories : [];
});

const currentSpeechText = computed(() => {
  const activeSub = currentSubCategories.value.find((sub) => sub.id === activeLevel2Id.value);
  return activeSub ? activeSub.speechText : "";
});

const startCall = async () => {
  globalAudioManager.unlock();
  if (!VoiceRecognizerWithVAD.isSupported()) {
    notify.error("Current browser does not support speech recognition");
    return;
  }
  try {
    const recognizer = new VoiceRecognizerWithVAD({
      vad: CONFIG.vad,
      onVoiceStart: () => {},
    });
    await recognizer.init();
    recognizer.close();
    const activeCategory = categoryData.value.find((cat) => cat.id === activeLevel1Id.value);
    const activeSubCategory = activeCategory?.subCategories.find((sub) => sub.id === activeLevel2Id.value);
    router.push({
      path: "/chatroom",
      query: {
        scene: "1",
        category: activeCategory?.title?.replace(/\n/g, "") || "",
        sub_category: activeSubCategory?.title || "",
        speechText: activeSubCategory?.speechText || "",
      },
    });
  } catch (error) {
    console.error("Start call failed:", error);
    notify.error(`Start failed: ${error.message}`);
  }
};

const goBack = () => router.push("/home");
</script>

<template>
  <div class="min-h-[100dvh] bg-[var(--app-bg)] px-3 pb-3 pt-3">
    <div class="space-y-3">
      <header class="neo-raised rounded-[28px] px-4 py-4">
        <button type="button" @click="goBack" class="neo-raised flex h-11 w-11 items-center justify-center rounded-full active:neo-inset transition-all mb-3">
          <ArrowLeft :size="18" :stroke-width="1.5" class="text-slate-500" />
        </button>
        <p class="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-700/70">Study Abroad AI</p>
        <h1 class="mt-2 font-[var(--font-display)] text-[2.85rem] font-semibold leading-[0.88] tracking-[0.01em] text-slate-900">Admissions</h1>
        <p class="font-[var(--font-display)] text-[2rem] leading-none text-slate-900/92">Consultant</p>
        <p class="mt-2.5 text-[14px] leading-7 text-slate-500">Select a topic and start your voice consultation.</p>
      </header>

      <section class="rounded-[28px] bg-[#f7fbff] px-3 py-4 shadow-none">
        <div class="mb-4 px-1">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700/60">Conversation Scope</p>
          <h2 class="mt-0.5 text-[1.4rem] font-bold tracking-tight text-slate-900">Choose a topic</h2>
        </div>
        <nav class="grid grid-cols-2 gap-2.5">
          <button
            v-for="item in categoryData" :key="item.id" @click="handleLevel1Click(item)"
            class="flex min-h-[90px] flex-col items-start justify-between rounded-[22px] p-3 transition-all duration-200"
            :class="activeLevel1Id === item.id ? 'neo-inset' : 'neo-raised active:scale-95'"
          >
            <span class="flex h-8 w-8 items-center justify-center rounded-[12px]" :class="activeLevel1Id === item.id ? 'bg-sky-500 text-white shadow-inner' : 'neo-icon-box text-sky-600'">
              <component :is="iconMap[item.iconType]" :size="16" stroke-width="2" />
            </span>
            <span class="block text-[13.5px] font-bold whitespace-pre-line" :class="activeLevel1Id === item.id ? 'text-sky-800' : 'text-slate-700'">{{ item.title }}</span>
          </button>
        </nav>
        <div class="mt-5 space-y-2.5">
          <button
            v-for="sub in currentSubCategories" :key="sub.id" @click="activeLevel2Id = sub.id"
            class="group relative flex w-full items-center justify-between rounded-[20px] px-4 py-3 transition-all duration-200"
            :class="activeLevel2Id === sub.id ? 'neo-inset' : 'neo-raised active:scale-[0.98]'"
          >
            <span class="flex min-w-0 items-center gap-3">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px]" :class="activeLevel2Id === sub.id ? 'bg-sky-500 text-white' : 'neo-icon-box text-sky-500'">
                <Mic :size="16" :stroke-width="2.5" />
              </span>
              <span class="min-w-0 text-left">
                <span class="block truncate text-[14px] font-bold" :class="activeLevel2Id === sub.id ? 'text-sky-800' : 'text-slate-700'">{{ sub.title }}</span>
                <span class="block truncate font-[var(--font-mono)] text-[9px] uppercase text-slate-400">Preset Reply</span>
              </span>
            </span>
            <ArrowRight :size="14" :stroke-width="3" class="transition-all" :class="activeLevel2Id === sub.id ? 'text-sky-500 translate-x-1' : 'text-slate-300'" />
          </button>
        </div>
      </section>

      <section class="neo-raised rounded-[28px] bg-white/80 px-4 py-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700/70">Opening Speech</p>
        <p class="mt-2.5 text-[14px] leading-8 text-slate-600">"{{ currentSpeechText }}"</p>
      </section>

      <button
        type="button" @click="startCall"
        class="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-slate-900/96 text-[15px] font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.16)] transition hover:bg-sky-600 active:scale-[0.98]"
      >
        <Mic :size="16" :stroke-width="1.5" class="text-white" />
        <span>Start AI Call</span>
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/StudyAbroadView.vue
git commit -m "feat: create StudyAbroadView with existing category selection logic"
```

---

### Task 11: Create InterviewView

**Files:**
- Create: `frontend/src/views/InterviewView.vue`

- [ ] **Step 1: Create the interview page with dark theme**

```vue
<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, ArrowRight, UserCheck, Users, Briefcase, Code, TrendingUp, FileText, ChevronDown, ChevronUp } from "lucide-vue-next";
import { CONFIG } from "../utils/config.js";
import { VoiceRecognizerWithVAD } from "../utils/voiceRecognizer.js";
import { globalAudioManager } from "../utils/audioManager.js";
import { notify } from "../utils/toast.js";

const router = useRouter();

const mode = ref("interviewee"); // "interviewee" | "interviewer"
const domain = ref("Behavioral");
const resumeExpanded = ref(false);

const domains = ["Behavioral", "Tech / Engineering", "Consulting", "Product Management", "General"];

const modeLabel = computed(() => {
  return mode.value === "interviewee"
    ? "You are the candidate. AI will interview you."
    : "You are the interviewer. AI plays the candidate.";
});

const startCall = async () => {
  globalAudioManager.unlock();
  if (!VoiceRecognizerWithVAD.isSupported()) {
    notify.error("Current browser does not support speech recognition");
    return;
  }
  try {
    const recognizer = new VoiceRecognizerWithVAD({
      vad: CONFIG.vad,
      onVoiceStart: () => {},
    });
    await recognizer.init();
    recognizer.close();
    router.push({
      path: "/chatroom",
      query: {
        scene: "2",
        mode: mode.value,
        category: domain.value,
        sub_category: mode.value,
        speechText: mode.value === "interviewee"
          ? "Hello! I'm your interviewer today. Let's begin. Tell me about yourself."
          : "Hello! I'm the candidate today. Please go ahead with your first question.",
      },
    });
  } catch (error) {
    console.error("Start call failed:", error);
    notify.error(`Start failed: ${error.message}`);
  }
};

const goBack = () => router.push("/home");
</script>

<template>
  <div class="min-h-[100dvh] bg-slate-950 px-3 pb-3 pt-3">
    <div class="space-y-3">
      <header class="rounded-[28px] border border-white/10 bg-slate-900/80 px-4 py-4 backdrop-blur">
        <button type="button" @click="goBack" class="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 active:bg-white/10 transition-all mb-3">
          <ArrowLeft :size="18" :stroke-width="1.5" class="text-slate-400" />
        </button>
        <p class="text-[11px] font-semibold uppercase tracking-[0.34em] text-amber-400/80">AI Interviewer</p>
        <h1 class="mt-2 font-[var(--font-mono)] text-[2.6rem] font-bold leading-[0.9] tracking-tight text-white">Mock</h1>
        <p class="font-[var(--font-mono)] text-[2rem] font-bold leading-none text-amber-400">Interview</p>
        <p class="mt-2.5 text-[14px] leading-7 text-slate-400">Practice with an AI that won't judge — or be the interviewer yourself.</p>
      </header>

      <section class="rounded-[24px] border border-white/10 bg-slate-900/80 px-4 py-4">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/70 mb-3">Mode</p>
        <div class="grid grid-cols-2 gap-2.5">
          <button
            type="button" @click="mode = 'interviewee'"
            class="flex flex-col items-center gap-2 rounded-[18px] p-4 transition-all"
            :class="mode === 'interviewee' ? 'border-2 border-amber-400 bg-amber-400/10' : 'border border-white/10 bg-white/5'"
          >
            <UserCheck :size="22" :stroke-width="2" :class="mode === 'interviewee' ? 'text-amber-400' : 'text-slate-500'" />
            <span class="text-[13px] font-bold" :class="mode === 'interviewee' ? 'text-white' : 'text-slate-400'">I'm the Candidate</span>
          </button>
          <button
            type="button" @click="mode = 'interviewer'"
            class="flex flex-col items-center gap-2 rounded-[18px] p-4 transition-all"
            :class="mode === 'interviewer' ? 'border-2 border-amber-400 bg-amber-400/10' : 'border border-white/10 bg-white/5'"
          >
            <Users :size="22" :stroke-width="2" :class="mode === 'interviewer' ? 'text-amber-400' : 'text-slate-500'" />
            <span class="text-[13px] font-bold" :class="mode === 'interviewer' ? 'text-white' : 'text-slate-400'">I'm the Interviewer</span>
          </button>
        </div>
        <p class="mt-3 text-[12px] text-slate-500 text-center">{{ modeLabel }}</p>
      </section>

      <section class="rounded-[24px] border border-white/10 bg-slate-900/80 px-4 py-4">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/70 mb-3">Domain</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="d in domains" :key="d" type="button" @click="domain = d"
            class="rounded-full px-4 py-2 text-[12px] font-semibold transition-all"
            :class="domain === d ? 'bg-amber-400 text-slate-900' : 'bg-white/5 text-slate-400 border border-white/10'"
          >
            {{ d }}
          </button>
        </div>
      </section>

      <section class="rounded-[24px] border border-white/10 bg-slate-900/80 px-4 py-4">
        <button type="button" @click="resumeExpanded = !resumeExpanded" class="flex w-full items-center justify-between">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/70">Resume (Optional)</p>
            <p class="mt-1 text-[12px] text-slate-500">Upload your resume for tailored questions</p>
          </div>
           <component :is="resumeExpanded ? ChevronUp : ChevronDown" :size="18" stroke-width="1.5" class="text-slate-500" />
        </button>
        <div v-if="resumeExpanded" class="mt-4 rounded-[16px] border border-dashed border-white/10 bg-white/5 p-6 text-center">
          <FileText :size="28" stroke-width="1.5" class="text-slate-600 mx-auto mb-2" />
          <p class="text-[13px] text-slate-500">Resume upload coming soon.</p>
          <p class="text-[11px] text-slate-600 mt-1">Generic interview questions will be used.</p>
        </div>
      </section>

      <button
        type="button" @click="startCall"
        class="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-amber-400/30 bg-amber-400 text-[15px] font-semibold text-slate-900 shadow-[0_0_30px_rgba(251,191,36,0.2)] transition active:scale-[0.98] hover:shadow-[0_0_40px_rgba(251,191,36,0.35)]"
      >
        <span>Start Interview</span>
        <ArrowRight :size="16" :stroke-width="2" />
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/InterviewView.vue
git commit -m "feat: create InterviewView with dark theme, mode/domain selection"
```

---

### Task 12: Create EnglishCoachView

**Files:**
- Create: `frontend/src/views/EnglishCoachView.vue`

- [ ] **Step 1: Create the English coach page with mint green theme**

```vue
<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, ArrowRight, MessageCircle, Coffee, Plane, Utensils, Building2, Briefcase, GraduationCap } from "lucide-vue-next";
import { CONFIG } from "../utils/config.js";
import { VoiceRecognizerWithVAD } from "../utils/voiceRecognizer.js";
import { globalAudioManager } from "../utils/audioManager.js";
import { notify } from "../utils/toast.js";

const router = useRouter();

const coachMode = ref("roleplay"); // "roleplay" | "freetalk"
const scenario = ref("Coffee Shop");
const difficulty = ref("Intermediate");
const grammarCorrection = ref(true);

const scenarios = [
  { name: "Coffee Shop", icon: Coffee },
  { name: "Airport", icon: Plane },
  { name: "Restaurant", icon: Utensils },
  { name: "University", icon: GraduationCap },
  { name: "Job Interview", icon: Briefcase },
  { name: "Hotel", icon: Building2 },
];

const difficulties = ["Beginner", "Intermediate", "Advanced"];

const startCall = async () => {
  globalAudioManager.unlock();
  if (!VoiceRecognizerWithVAD.isSupported()) {
    notify.error("Current browser does not support speech recognition");
    return;
  }
  try {
    const recognizer = new VoiceRecognizerWithVAD({
      vad: CONFIG.vad,
      onVoiceStart: () => {},
    });
    await recognizer.init();
    recognizer.close();
    router.push({
      path: "/chatroom",
      query: {
        scene: "3",
        category: coachMode.value === "roleplay" ? scenario.value : `Free Talk (${difficulty.value})`,
        sub_category: grammarCorrection.value ? "grammar-on" : "grammar-off",
        speechText: coachMode.value === "roleplay"
          ? `Welcome to the ${scenario.value}! I'll be the other person here. Let's practice this scenario.`
          : `Hi! Let's have a conversation. I'll help you with your English along the way.`,
      },
    });
  } catch (error) {
    console.error("Start call failed:", error);
    notify.error(`Start failed: ${error.message}`);
  }
};

const goBack = () => router.push("/home");
</script>

<template>
  <div class="min-h-[100dvh] bg-[var(--app-bg)] px-3 pb-3 pt-3">
    <div class="space-y-3">
      <header class="neo-raised rounded-[28px] px-4 py-4 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/40">
        <button type="button" @click="goBack" class="neo-raised flex h-11 w-11 items-center justify-center rounded-full active:neo-inset transition-all mb-3 bg-white/80">
          <ArrowLeft :size="18" :stroke-width="1.5" class="text-slate-500" />
        </button>
        <p class="text-[11px] font-semibold uppercase tracking-[0.34em] text-emerald-700/70">Language Practice</p>
        <h1 class="mt-2 text-[2.5rem] font-bold leading-[0.9] tracking-tight text-slate-900">English</h1>
        <p class="text-[2rem] font-bold leading-none text-emerald-600">Speaking Coach</p>
        <p class="mt-2.5 text-[14px] leading-7 text-slate-500">Practice real-world English with instant grammar feedback.</p>
      </header>

      <section class="neo-raised rounded-[24px] bg-white/80 px-4 py-4">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700/60 mb-3">Practice Mode</p>
        <div class="grid grid-cols-2 gap-2.5">
          <button
            type="button" @click="coachMode = 'roleplay'"
            class="flex flex-col items-center gap-2 rounded-[18px] p-4 transition-all"
            :class="coachMode === 'roleplay' ? 'neo-inset border-2 border-emerald-400 bg-emerald-50' : 'neo-raised'"
          >
            <span class="text-2xl">🎭</span>
            <span class="text-[13px] font-bold" :class="coachMode === 'roleplay' ? 'text-emerald-800' : 'text-slate-700'">Scenario Roleplay</span>
          </button>
          <button
            type="button" @click="coachMode = 'freetalk'"
            class="flex flex-col items-center gap-2 rounded-[18px] p-4 transition-all"
            :class="coachMode === 'freetalk' ? 'neo-inset border-2 border-emerald-400 bg-emerald-50' : 'neo-raised'"
          >
            <span class="text-2xl">💬</span>
            <span class="text-[13px] font-bold" :class="coachMode === 'freetalk' ? 'text-emerald-800' : 'text-slate-700'">Free Talk</span>
          </button>
        </div>
      </section>

      <section v-if="coachMode === 'roleplay'" class="neo-raised rounded-[24px] bg-white/80 px-4 py-4">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700/60 mb-3">Choose Scenario</p>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="s in scenarios" :key="s.name" type="button" @click="scenario = s.name"
            class="flex flex-col items-center gap-1.5 rounded-[16px] p-3 transition-all"
            :class="scenario === s.name ? 'neo-inset border-2 border-emerald-400 bg-emerald-50' : 'neo-raised'"
          >
            <component :is="s.icon" :size="18" stroke-width="1.5" :class="scenario === s.name ? 'text-emerald-600' : 'text-slate-400'" />
            <span class="text-[10px] font-semibold" :class="scenario === s.name ? 'text-emerald-800' : 'text-slate-600'">{{ s.name }}</span>
          </button>
        </div>
      </section>

      <section v-if="coachMode === 'freetalk'" class="neo-raised rounded-[24px] bg-white/80 px-4 py-4">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700/60 mb-3">Difficulty</p>
        <div class="flex gap-2">
          <button
            v-for="d in difficulties" :key="d" type="button" @click="difficulty = d"
            class="flex-1 rounded-full py-2.5 text-[12px] font-semibold transition-all"
            :class="difficulty === d ? 'bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]' : 'neo-raised text-slate-500'"
          >
            {{ d }}
          </button>
        </div>
      </section>

      <section class="neo-raised rounded-[24px] bg-white/80 px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700/60">Grammar Correction</p>
            <p class="mt-0.5 text-[12px] text-slate-500">AI will correct your mistakes after each reply</p>
          </div>
          <button
            type="button" @click="grammarCorrection = !grammarCorrection"
            class="relative h-7 w-12 rounded-full transition-colors"
            :class="grammarCorrection ? 'bg-emerald-500' : 'bg-slate-300'"
          >
            <span class="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform" :class="grammarCorrection ? 'translate-x-[22px]' : 'translate-x-0.5'" />
          </button>
        </div>
      </section>

      <button
        type="button" @click="startCall"
        class="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-emerald-500 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(16,185,129,0.3)] transition active:scale-[0.98] hover:bg-emerald-600"
      >
        <MessageCircle :size="16" :stroke-width="1.5" class="text-white" />
        <span>Start Speaking</span>
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/EnglishCoachView.vue
git commit -m "feat: create EnglishCoachView with scenario roleplay and grammar toggle"
```

---

### Task 13: Update Chatroom to Support SceneType

**Files:**
- Modify: `frontend/src/views/chatroom.vue`

- [ ] **Step 1: Read sceneType from route query and pass to all LLM calls**

In `chatroom.vue`, read `sceneType` from the route query and include it in:
1. The request body passed to `fetchChatStream()` (SSE streaming)
2. Calls to `LLMServer.chat()` (non-streaming fallback)
3. Calls to `LLMServer.generateReport()` (report generation)

Find where the route query is read (already has `route.query.category`, `route.query.sub_category`). Add:
```js
const sceneType = computed(() => Number(route.query.scene) || 1);
```

In the call to `fetchChatStream(requestBody, ...)`, ensure the requestBody includes:
```js
const requestBody = {
  conversation: messages.value.map(m => ({ role: m.role, content: m.content })),
  category: category.value,
  sub_category: subCategory.value,
  sceneType: sceneType.value,
};
```

In calls to `LLMServer.chat()` and `LLMServer.generateReport()`, add the 4th argument:
```js
// Non-streaming chat
await LLMServer.chat(messages, category, subCategory, sceneType.value)

// Report generation
await LLMServer.generateReport(messages, category, subCategory, sceneType.value)
```

The exact variable names and call sites depend on the current chatroom implementation — search for `LLMServer.chat`, `LLMServer.generateReport`, and `fetchChatStream` in `chatroom.vue` to find the precise locations.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/chatroom.vue
git commit -m "feat: pass sceneType from chatroom route query to backend API"
```

---

### Task 14: Create WaveformVisualizer Component

**Files:**
- Create: `frontend/src/components/WaveformVisualizer.vue`

- [ ] **Step 1: Create the Canvas-based waveform component**

```vue
<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";

const props = defineProps({
  volume: { type: Number, default: 0 },
  barCount: { type: Number, default: 48 },
  color: { type: String, default: "#10b981" },
});

const canvasRef = ref(null);
let animFrameId = null;
const barHeights = ref([]);
const targetHeights = ref([]);
const DECAY = 0.12;

// Pre-compute center-weight distribution (Gaussian-like)
const weights = [];
for (let i = 0; i < props.barCount; i++) {
  const t = (i - props.barCount / 2) / (props.barCount / 4);
  weights.push(Math.exp(-t * t * 0.8));
}

const draw = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const barWidth = (width / props.barCount) * 0.7;
  const gap = (width / props.barCount) * 0.3;
  const maxBarHeight = height * 0.85;

  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < props.barCount; i++) {
    const w = weights[i];
    const jitter = 0.6 + Math.random() * 0.4;
    // Target: volume * center weight * random jitter
    let target = props.volume * w * jitter * maxBarHeight;
    // Add minimum floor when volume > 0
    if (props.volume > 0.01) {
      target = Math.max(target, maxBarHeight * 0.03 * w * Math.random());
    }
    targetHeights.value[i] = target;

    // Smooth decay to target
    if (barHeights.value[i] === undefined) barHeights.value[i] = 0;
    barHeights.value[i] += (targetHeights.value[i] - barHeights.value[i]) * DECAY;

    const h = Math.max(1, barHeights.value[i]);
    const x = i * (barWidth + gap) + gap / 2;
    const y = height - h;

    // Gradient from base color to lighter
    const gradient = ctx.createLinearGradient(x, height, x, y);
    gradient.addColorStop(0, props.color);
    gradient.addColorStop(1, props.color + "88");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, h, [barWidth / 2, barWidth / 2, 2, 2]);
    ctx.fill();
  }

  animFrameId = requestAnimationFrame(draw);
};

const resize = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth * devicePixelRatio;
  canvas.height = parent.clientHeight * devicePixelRatio;
  canvas.style.width = parent.clientWidth + "px";
  canvas.style.height = parent.clientHeight + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(devicePixelRatio, devicePixelRatio);
};

onMounted(() => {
  barHeights.value = new Array(props.barCount).fill(0);
  targetHeights.value = new Array(props.barCount).fill(0);
  resize();
  window.addEventListener("resize", resize);
  animFrameId = requestAnimationFrame(draw);
});

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  window.removeEventListener("resize", resize);
});
</script>

<template>
  <div class="relative w-full h-full min-h-[60px]">
    <canvas ref="canvasRef" class="w-full h-full" />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/WaveformVisualizer.vue
git commit -m "feat: create Canvas-based WaveformVisualizer component"
```

---

### Task 15: Integrate WaveformVisualizer into Chatroom

**Files:**
- Modify: `frontend/src/views/chatroom.vue`

- [ ] **Step 1: Import and add WaveformVisualizer**

Add import:
```js
import WaveformVisualizer from "@/components/WaveformVisualizer.vue";
```

In the template, find the LISTENING state section (where the pulsing halo circles are) and replace with:

```html
<div v-if="isListening" class="w-full h-16">
  <WaveformVisualizer :volume="microphoneVolume" bar-count="48" color="#10b981" />
</div>
```

Keep the existing TTS waveform (36-bar CSS scaleY) for the SPEAKING state unchanged.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/chatroom.vue
git commit -m "feat: integrate WaveformVisualizer into chatroom mic state"
```

---

### Task 16: Build Verification + Final Commit

- [ ] **Step 1: Build backend**

Run: `dotnet build backend/AICall.API.csproj`
Expected: Build succeeded, 0 errors.

- [ ] **Step 2: Build frontend**

Run: `cd frontend && pnpm build`
Expected: Build succeeded, dist/ produced.

- [ ] **Step 3: Final commit if any uncommitted changes**

```bash
git status
git add -A
git commit -m "chore: verify full build after scenario-switcher + waveform implementation"
```
