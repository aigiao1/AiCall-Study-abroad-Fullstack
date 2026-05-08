# AiCall — AI-Powered Voice Admissions Consultant

> An intelligent full-stack voice conversation platform that lets users speak naturally with AI across multiple scenarios — admissions consulting, mock interviews, and English coaching — via a real-time ASR → LLM → TTS pipeline.

> 一个智能全栈语音对话平台，用户通过实时语音（ASR → LLM → TTS）与 AI 自然交流，覆盖留学咨询、模拟面试、英语口语教练三大场景。

---

## Overview

AiCall is a production-grade voice AI application built with **.NET 8 Web API** and **Vue 3**. It demonstrates a complete real-time audio processing pipeline: the user speaks, the app transcribes via Whisper ASR (Automatic Speech Recognition / 自动语音识别), streams the text to DeepSeek LLM (Large Language Model / 大语言模型) for an intelligent response, then converts the reply back to speech via TTS (Text-to-Speech / 文字转语音) — all with <200ms latency on each link.

The platform supports **three distinct AI personas**, each with its own System Prompt (系统提示词), visual theme, and interaction flow:

| Scenario / 场景 | AI Persona | Theme |
|---|---|---|
| 🎓 **Study Abroad Advisor** (留学顾问) | Professional admissions consultant | Sky Blue + Ivory |
| 🤖 **Mock Interview** (模拟面试) | Technical interviewer or job candidate | Dark Slate + Amber Gold |
| 🌍 **English Coach** (英语教练) | Speaking coach with grammar correction | Mint Green + Warm White |

---

## Features

### Voice Pipeline (语音处理链路)
- **VAD** (Voice Activity Detection / 语音活动检测) — auto-detects when the user starts and stops speaking
- **ASR** via Whisper — transcribes speech to text with silence trimming
- **LLM Streaming** via SSE (Server-Sent Events / 服务器推送事件) — AI replies stream word-by-word for a natural conversation feel
- **TTS** playback — converts AI text to natural-sounding speech
- **Barge-in** (打断) support — user can interrupt AI mid-speech

### Platform
- **Scenario Switcher** (场景切换器) — 3 independent AI personas with distinct System Prompts
- **Data Dashboard** — ApexCharts-powered analytics with donut/bar charts, count-up animations, and recent sessions
- **Call History** — paginated session list with full message replay and AI-generated summaries
- **Voice Waveform** — real-time Canvas-based audio visualizer during recording
- **Responsive Mobile-First UI** — neumorphic (新拟态) glassmorphism design, optimized for 430px mobile viewport

---

## Architecture

```
User Speech → [VAD Mic] → ASR (Whisper) → LLM (DeepSeek, SSE stream) → TTS → Speaker
                                    ↓
                            CallSession stored in SQL Server
```

### Backend — `.NET 8 Web API`
```
backend/
├── Controllers/         # REST endpoints under /aicall/api/
├── Services/
│   ├── LLMService.cs    # DeepSeek integration + 4 System Prompts
│   └── SpeechService.cs # Whisper ASR + OpenAI TTS
├── Models/              # EF Core entities (CallSession, CallMessage, SceneType)
├── Repositories/        # Data access with dashboard aggregation queries
├── Dtos/                # Request/response contracts
└── Middleware/           # Global exception handling
```

### Frontend — `Vue 3 + Vite + Tailwind CSS v4`
```
frontend/src/
├── views/
│   ├── HomeView.vue          # 3 scenario entry cards
│   ├── StudyAbroadView.vue   # Category/sub-category selection
│   ├── InterviewView.vue     # Mode/domain picker, dark theme
│   ├── EnglishCoachView.vue  # Scenario roleplay, grammar toggle
│   ├── chatroom.vue          # Real-time voice call UI
│   ├── DashboardView.vue     # Analytics with ApexCharts
│   └── HistoryList.vue       # Paginated call history
├── composables/         # Stateful logic hooks (useMicrophone, useSSEChatStream, etc.)
├── components/
│   └── WaveformVisualizer.vue # Canvas audio waveform
└── utils/               # Voice recognizer, audio manager, API client
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | .NET 8, ASP.NET Core Web API, EF Core, SQL Server |
| Frontend | Vue 3 (Composition API), Vite, Tailwind CSS v4 |
| AI / ML | DeepSeek Chat (LLM), OpenAI Whisper (ASR), OpenAI TTS |
| Real-time | Server-Sent Events (SSE), Web Audio API |
| Charts | ApexCharts (vue3-apexcharts) |
| Auth | JWT (HMAC-SHA512), ASP.NET Core Identity |
| Audio | recorder-core, Web Audio API (AnalyserNode) |
| Proxy | IHttpClientFactory with China-region HTTP proxy |

---

## Quick Start

### Prerequisites
- .NET 8 SDK
- Node.js 18+ + pnpm
- SQL Server (LocalDB or full)

### Backend
```bash
cd backend
# Set environment variables:
#   LLM__BaseUrl, LLM__ApiKey, LLM__ModelName
#   Speech__ApiKey, Speech__BaseUrl
#   JWT__SecretKey (HMAC-SHA512)
powershell -File start-dev.ps1
# → https://localhost:7003
```

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
# → https://localhost:5175/aicall/
```

---

## Project Motivation

This project was built as a personal showcase of full-stack engineering capability. It integrates a non-trivial real-time audio pipeline, multi-agent AI prompt engineering, responsive UI design, and database-backed analytics — demonstrating the ability to architect, build, and ship a complete production-quality application from scratch.

> 本项目是我个人全栈能力的综合展示，集成了实时音频处理链路、多角色 AI 提示词工程、响应式 UI 设计、数据库分析看板，体现从零搭建完整生产级应用的能力。

---

## License

MIT
