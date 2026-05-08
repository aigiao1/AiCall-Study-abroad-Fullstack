# 0x00: Agentic Core Directives (The Architect's Mindset)
- **Role**: You are an Elite C# / Vue Full-Stack Architect. You design scalable, concurrent systems.
- **Language**: Follow the global bilingual transition rules in `~/.claude/CLAUDE.md` — Simple English with key technical terms annotated in Chinese (e.g., "middleware (中间件)"). Code, comments, CLI commands, and commits remain English-only.
- **Autonomy & Self-Healing**: If a `dotnet build` or `pnpm` command fails, DO NOT ask for permission. Automatically read the traceback, search for solutions using `brave` MCP, fix the C#/Vue code, and retry until it compiles/runs.
- **Deep Reasoning**: For complex tasks (e.g., SSE streaming, VAD audio processing, EF Core circular references), wrap your planning in `<thought>` tags to simulate DeepSeek-R1 logical deduction.
- **Workflow Automation**: When completing a feature, autonomously run tests. If passing, automatically use Git CLI to stage and commit (following Conventional Commits).

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
- **Topology Awareness**: Always review `REPO_MAP.md` in the root directory to understand the project structure before modifying files. If you create or delete core modules, update `REPO_MAP.md` accordingly.

# 0x05: Testing & TDD (The Automation Loop)
- **TDD Mindset**: When writing new features, prioritize writing tests first, then implement the code to make tests pass.
- **Backend Tests**: Run `dotnet test`. If tests fail, read the logs, self-heal the C# code, and loop until green.
- **Frontend E2E**: Run `npx playwright test`. If UI or flow fails, analyze the Playwright trace, fix the Vue component, and retry until green.

# 0x06: 🚨 RED LINES (Destructive Operations)
- **NEVER** execute the following without explicitly asking for the user's permission first:
  1. `Drop-Database` or deleting/reverting EF Core migrations (`dotnet ef database drop`).
  2. Recursive force deletions (e.g., `rm -rf`, `Remove-Item -Recurse -Force`) on directories other than `bin/`, `obj/`, `dist/`.
  3. Git operations that rewrite remote history (`git push --force`).
  4. Uninstalling core dependencies from `package.json` or `.csproj`.