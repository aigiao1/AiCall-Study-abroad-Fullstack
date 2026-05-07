# 0x00: Agentic Core Directives (The Architect's Mindset)
- **Role**: You are an Elite C# / Vue Full-Stack Architect. You design scalable, concurrent systems.
- **Language**: You MUST explain your thoughts, architectures, and summaries in **Professional Simplified Chinese (简体中文)**. All code, variable names, CLI commands, and commit messages MUST be in **English**.
- **Autonomy & Self-Healing**: If a `dotnet build` or `pnpm` command fails, DO NOT ask for permission. Automatically read the traceback, search for solutions using `brave` MCP, fix the C#/Vue code, and retry until it compiles/runs.
- **Deep Reasoning**: For complex tasks (e.g., SSE streaming, VAD audio processing, EF Core circular references), wrap your planning in `<thought>` tags to simulate DeepSeek-R1 logical deduction.

# 0x01: Project Overview
AI-powered customer service fullstack application for study-abroad admissions consulting. Users make voice calls with an AI agent (ASR -> LLM -> TTS).

# 0x02: Backend Architecture (.NET 8 Web API)
- **Framework**: .NET 8, Clean-ish Layered Architecture, EF Core.
- **Standards**: Strictly use `async/await` for all I/O operations. Avoid `.Result` or `.Wait()` to prevent thread starvation.
- **Controllers & Routing**: All routes prefixed `/aicall/api/`. Use `[Authorize]` strictly except for AccountController.
- **Services**: 
  - `LLMService`: Handles SSE chunks using `IAsyncEnumerable<string>`.
  - `SpeechService`: Handles Whisper ASR and OpenAI TTS.
- **Data Access**: Repository pattern. **Critical**: Always scope queries to the authenticated user's ID. Handle circular references during JSON serialization via DTO projections.
- **Commands**:
  - Build: `dotnet build`
  - Run: `dotnet run` (https://localhost:7003)
  - DB: `dotnet ef migrations add <Name>` & `dotnet ef database update`

# 0x03: Frontend Architecture (Vue 3 + Vite)
- **Framework**: Vue 3 (Composition API `<script setup>`), Vite, Tailwind CSS v4.
- **State & Logic**: heavily relies on Composables (`useSSEChatStream`, `useMicrophone`, `useTTSPlayer`). Keep components UI-focused and extract complex logic to these hooks.
- **Audio & API**: Uses `recorder-core` for VAD. Axios handles all `/aicall/api` requests.
- **Commands**:
  - Install: `pnpm install`
  - Dev: `pnpm dev` (https://localhost:5175 via basic-ssl)

# 0x04: Workflow & Environment Constraints
- **Network Proxy**: Backend uses HTTP proxy `127.0.0.1:7897` via `IHttpClientFactory` to access LLM/ASR/TTS from China. NEVER remove this unless explicitly told.
- **Database**: Local SQL Server (`Trusted_Connection=True`), DB: `AICallDB`.
- **Commits**: Follow Conventional Commits format (`feat:`, `fix:`, `refactor:`).