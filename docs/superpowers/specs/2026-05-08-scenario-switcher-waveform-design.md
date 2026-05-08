# Scenario Switcher + Voice Waveform — Design Spec

**Date**: 2026-05-08  
**Status**: Approved  
**Scope**: Backend + Frontend, 2-3 days

---

## 1. Overview

Transform the single-purpose "study-abroad advisor" app into a **multi-scenario AI platform** with three distinct personas. Add a real-time voice waveform visualizer to the chatroom.

### First Batch (this implementation)

| Feature | Description |
|---|---|
| Homepage redesign | 3 scenario entry cards with unique colors |
| StudyAbroad page | Migrate existing 4-category logic, academic blue-white theme |
| Interview page | Dual mode (interviewee / interviewer), dark amber theme |
| EnglishCoach page | Scenario roleplay + grammar correction toggle, mint green theme |
| Backend SceneType | Enum field on CallSession + 3 distinct System Prompts |
| Voice Waveform | Canvas-based real-time mic visualizer in chatroom |

### Second Batch (future)

Interview radar chart report, gauntlet mode (Easy→Hard), vocabulary challenge game, speaking progress tracking, resume upload + AI parsing.

---

## 2. Backend Design

### 2.1 SceneType Enum

New file: `backend/Models/SceneType.cs`

```csharp
public enum SceneType
{
    StudyAbroad = 1,
    MockInterview = 2,
    EnglishCoach = 3
}
```

### 2.2 Entity Changes

**CallSession.cs** — add field:
```csharp
public SceneType SceneType { get; set; } = SceneType.StudyAbroad;
```

**Migration**: `dotnet ef migrations add AddSceneTypeToCallSession`

### 2.3 DTO Changes

**ChatRequestDto.cs** — add field:
```csharp
public SceneType SceneType { get; set; } = SceneType.StudyAbroad;
```

### 2.4 System Prompts (LLMService.cs)

Refactor: extract prompt selection to a private method `GetSystemPrompt(SceneType scene, string? category)`.

**StudyAbroad** (existing prompt, unchanged):
```
You are a highly professional, encouraging AI Admissions Consultant.
Language: English only. Tone: Friendly, professional, supportive.
Voice-call optimized: concise, conversational, no markdown.
Always end with a relevant question.
```

**MockInterview interviewee mode** (user is candidate):
```
You are a seasoned technical interviewer at a top tech company.
You conduct a realistic voice interview for: [{category}].
Rules:
1. Ask ONE question at a time, wait for the answer.
2. After each answer, ask a follow-up that digs deeper.
3. Tone: Professional, neutral. Don't say "Great answer!" — just move to the next question.
4. Keep responses concise — this is a voice conversation.
5. Language: English only.
```

**MockInterview interviewer mode** (user is interviewer, AI plays candidate):
```
You are a job candidate interviewing for a [{category}] position.
The user is the interviewer. Your job:
1. Answer their questions as a competent but not perfect candidate.
2. Occasionally make a small mistake (e.g., miss a detail) so the interviewer can catch it.
3. After the session, briefly rate the interviewer's questioning skills out of 10.
4. Language: English only. Keep answers under 60 seconds.
```

**EnglishCoach**:
```
You are a friendly, encouraging English speaking coach.
Your student wants to practice: [{category}].
Rules:
1. Speak ONLY in English. Use clear, slightly slower speech.
2. After EVERY student response, do TWO things:
   a) Reply naturally to continue the conversation.
   b) At the end, point out 1-2 grammar or pronunciation errors with corrections.
   Format errors as: [Grammar: "incorrect" → "correct" — explanation]
3. Be encouraging but honest. Celebrate good phrasing.
4. Keep your replies under 40 seconds — this is voice conversation.
```

### 2.5 Endpoint Changes

No new endpoints. Existing `/chat-stream` and `/chat` accept `SceneType` in the request body. The field is optional and defaults to `StudyAbroad` for backward compatibility.

---

## 3. Frontend Design

### 3.1 Router (`router/index.js`)

New routes:
```js
{ path: "/study-abroad", name: "StudyAbroad", component: StudyAbroadView, meta: { requiresAuth: true } }
{ path: "/interview", name: "Interview", component: InterviewView, meta: { requiresAuth: true } }
{ path: "/english-coach", name: "EnglishCoach", component: EnglishCoachView, meta: { requiresAuth: true } }
```

`ChatRoom` route updated to also accept `sceneType` query param (already receives `category`, `subCategory`, `speechText`).

### 3.2 HomeView — Redesign

Replace current 4-category grid with 3 scenario cards:

```
┌──────────────────────────────────┐
│  AI Concierge                    │
│  Choose a service                │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 🎓 留学顾问                 │  │  sky-100 bg, sky-600 accent
│  │ 选校 · 学术 · 预算 · 签证  │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🤖 模拟面试官               │  │  amber-50 bg, amber-500 accent
│  │ 被面试 · 当面试官 · 闯关   │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🌍 英语口语教练             │  │  emerald-50 bg, emerald-500 accent
│  │ 情景对话 · 语法纠错 · 评分的│  │
│  └────────────────────────────┘  │
│                                  │
│  📊 Dashboard    📋 History     │
└──────────────────────────────────┘
```

Each card:
- Neo-raised glassmorphism style (consistent with existing design)
- Unique gradient background + accent color
- Click → router.push to respective detail page
- Dashboard + History buttons remain at bottom

### 3.3 StudyAbroadView (NEW)

**Route**: `/study-abroad`  
**Theme**: Ivory white + deep sky blue, Georgia serif headline  
**Content**: Migrate the existing 4-category + sub-category logic from current HomeView.

Structure:
```
Header (back button + "Admissions Consultant" title)
4 category cards in 2x2 grid (School, Academic, Budget, Pre-departure)
Sub-category list with Mic icons
Opening speech preview
"Start AI Call" button → /chatroom?scene=StudyAbroad&...
```

This is essentially the current HomeView content wrapped in a new page. HomeView becomes just the 3-card entry.

### 3.4 InterviewView (NEW)

**Route**: `/interview`  
**Theme**: Dark slate background + amber gold accents, Monospace headline  

Structure:
```
Header (back button + "Mock Interview" title, dark bg)

Section 1: Mode Picker
  ┌──────────────┐  ┌──────────────┐
  │ 🎯 I'm the   │  │ 🕵️ I'm the   │
  │  candidate   │  │  interviewer │
  └──────────────┘  └──────────────┘

Section 2: Domain Picker (chips style)
  Behavioral | Tech/Engineering | Consulting | Product

Section 3: Resume Upload (collapsible, optional)
  "📎 Drop your resume or paste text"
  [Skip for generic questions →]

"Start Interview" button
```

Mode selection determines which System Prompt is used:
- `interviewee` → prompt where AI is the interviewer
- `interviewer` → prompt where AI plays the candidate

### 3.5 EnglishCoachView (NEW)

**Route**: `/english-coach`  
**Theme**: Mint green + warm white, System sans-serif  

Structure:
```
Header (back button + "English Speaking Coach" title, green gradient)

Section 1: Mode Picker
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ 🎭 Scenario  │  │ 💬 Free Talk │  │ 🎯 Vocab     │
  │  Roleplay    │  │              │  │  Challenge   │
  └──────────────┘  └──────────────┘  └──────────────┘

Section 2: Scenario Picker (shown when "Scenario Roleplay" selected)
  Coffee Shop | Airport | Restaurant | University | Job Interview

Section 3: Difficulty (shown when "Free Talk" selected)
  Beginner | Intermediate | Advanced

Section 4: Grammar Correction Toggle
  ┌──────────────────────────────────────┐
  │ 🔤 Grammar Correction    [ON ●]    │
  └──────────────────────────────────────┘

"Start Speaking" button
```

Grammar correction toggle: passes a flag to the backend that controls whether the EnglishCoach System Prompt includes the grammar error annotation instruction.

### 3.6 WaveformVisualizer (NEW component)

**File**: `frontend/src/components/WaveformVisualizer.vue`

A Canvas-based component that replaces the current static mic icon during recording.

Props:
- `volume: number` — 0-1 RMS microphone volume (from `useMicrophone`)
- `barCount: number` — default 48
- `color: string` — default `#10b981`

Behavior:
- `requestAnimationFrame` loop reads `volume` each frame
- Draws `barCount` vertical bars
- Each bar height = `volume * centerWeight[i] * randomJitter` where centerWeight is a Gaussian-like distribution (center bars taller, edges shorter)
- Smooth decay: bars don't snap to 0, they animate down over ~200ms
- Colors: gradient from base color at bottom to lighter variant at top

Integration into chatroom:
- Already have `microphoneVolume` from `useMicrophone`
- Replace the pulsing halo circles with `<WaveformVisualizer :volume="microphoneVolume.value" />`
- Keep the existing TTS waveform (36-bar CSS scaleY) for when AI is speaking

### 3.7 API Changes (`api/index.js`)

Update the chat/chat-stream functions to pass `sceneType`:
```js
export const apiChatStream = (conversation, category, subCategory, sceneType) =>
  request.post("/Conversation/chat-stream", {
    conversation, category, sub_category: subCategory, sceneType
  })
```

### 3.8 Chatroom Integration

`chatroom.vue` receives new query params:
- `scene` → maps to SceneType enum value
- Passed through to API calls
- WaveformVisualizer replaces mic halo during LISTENING state

---

## 4. Data Flow

```
HomeView (3 cards)
  │
  ├──→ StudyAbroadView → select topic → /chatroom?scene=StudyAbroad&...
  ├──→ InterviewView → select mode+domain → /chatroom?scene=MockInterview&...
  └──→ EnglishCoachView → select mode+topic → /chatroom?scene=EnglishCoach&...
                                │
                                ▼
                          chatroom.vue
                     receives query params
                     passes sceneType to API
                                │
                                ▼
                     POST /chat-stream
                     { conversation, category, sub_category, sceneType }
                                │
                                ▼
                     ConversationController
                     passes SceneType to LLMService
                                │
                                ▼
                     LLMService.GetSystemPrompt(sceneType, category)
                     → builds appropriate System Prompt
                                │
                                ▼
                     SSE stream back to frontend
                                │
                     (same flow for /report → saves SceneType to CallSession)
```

---

## 5. Files Changed (Complete List)

### Backend
| File | Action |
|---|---|
| `backend/Models/SceneType.cs` | **NEW** — enum |
| `backend/Models/CallSession.cs` | Edit — add SceneType field |
| `backend/Dtos/Conversation/ChatRequestDto.cs` | Edit — add SceneType field |
| `backend/Services/LLMService.cs` | Edit — extract prompt selection, add 3 prompts |
| `backend/Interfaces/ILLMService.cs` | Edit — SceneType parameter |
| `backend/Mappers/ConversationMappers.cs` | Edit — map SceneType to entity |
| Migration file | Auto-generated |

### Frontend
| File | Action |
|---|---|
| `frontend/src/views/HomeView.vue` | **Rewrite** — 3 scenario cards |
| `frontend/src/views/StudyAbroadView.vue` | **NEW** — migrate from HomeView |
| `frontend/src/views/InterviewView.vue` | **NEW** — interview modes |
| `frontend/src/views/EnglishCoachView.vue` | **NEW** — English coach |
| `frontend/src/components/WaveformVisualizer.vue` | **NEW** — Canvas waveform |
| `frontend/src/router/index.js` | Edit — add 3 routes |
| `frontend/src/api/index.js` | Edit — pass sceneType param |
| `frontend/src/views/chatroom.vue` | Edit — receive sceneType, integrate WaveformVisualizer |

---

## 6. Testing

- Build verification: `dotnet build` + `pnpm dev` both succeed
- Manual: click each card → enter detail page → start call → verify correct AI persona
- Manual: waveform visible during recording in chatroom
- Manual: grammar correction toggle works in English coach page
- Existing flow (direct /chatroom) still works with default StudyAbroad scene
