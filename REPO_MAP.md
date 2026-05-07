# REPO_MAP — 项目全局结构地图

> 生成时间：2026-05-07 | 每次启动 Claude Code 请先阅读此文件

---

## 顶层

```
AI_Customer_Service_Fullstack/
├── CLAUDE.md                  # Claude Code 行为指令
├── REPO_MAP.md                # [本文件] 全局结构地图
├── backend/                   # .NET 8 Web API 后端
└── frontend/                  # Vue 3 + Vite 前端
```

---

## 后端 `backend/` — .NET 8 Clean-ish 分层架构

```
backend/
├── Program.cs                 # 应用入口：DI 注册、中间件管道、启动校验
├── AICall.API.csproj          # 项目文件 (.NET 8, EF Core, JWT, Swagger)
├── backend.sln                # 解决方案文件
├── appsettings.json           # 配置文件（密钥已剥离，通过环境变量注入）
├── appsettings.example.json   # 脱敏配置模板
├── appsettings.Development.json # 开发环境日志配置
│
├── Controllers/               # [API 端点层] 路由前缀 /aicall/api/
│   ├── AccountController.cs   #   注册 / 登录 (无需鉴权)
│   ├── CallSessionsController.cs # 通话记录 CRUD (需鉴权)
│   ├── ConversationController.cs # AI 对话 (chat / chat-stream / report)
│   └── DealController.cs      #   语音处理 (ASR 转文字 + TTS 转语音)
│
├── Models/                    # [领域模型层] 数据库实体对应
│   ├── AppUser.cs             #   用户实体 (继承 IdentityUser)
│   ├── CallSession.cs         #   通话会话 (一对多 CallMessage)
│   ├── CallMessage.cs         #   通话消息 (属于 CallSession)
│   └── ApiErrorResponse.cs    #   全局异常中间件的标准化错误响应
│
├── Dtos/                      # [数据传输对象] 前后端契约
│   ├── Account/               #   登录/注册请求与响应
│   ├── CallSessionDto/        #   通话记录列表投影与分页查询
│   ├── Conversation/          #   对话请求、消息、LLM 摘要结果
│   └── PagedResult.cs         #   通用分页结果泛型包装
│
├── Data/
│   └── ApplicationDBContext.cs # EF Core DbContext + Identity 集成 + 角色种子
│
├── Interfaces/                # [接口契约层] 依赖注入抽象
│   ├── ICallSessionRepository.cs
│   ├── ILLMService.cs
│   ├── ISpeechService.cs
│   └── ITokenService.cs
│
├── Services/                  # [业务逻辑层] 接口实现
│   ├── LLMService.cs          #   LLM 调用 (非流式 + SSE 流式)，角色翻译 salesman→assistant
│   ├── SpeechService.cs       #   ASR (Whisper) + TTS (OpenAI TTS)
│   └── TokenService.cs        #   JWT 生成 (HMAC-SHA512, 7 天有效期)
│
├── Repositories/
│   └── CallSessionRepository.cs # 通话记录仓储 (分页、投影、级联删除)
│
├── Middleware/
│   └── GlobalExceptionMiddleware.cs # 全局异常处理：捕获未处理异常，返回 problem+json
│
├── Mappers/
│   └── ConversationMappers.cs  # ChatRequestDto → CallSession 实体映射
│
├── Extensions/
│   └── ClaimsExtensions.cs     # ClaimsPrincipal 扩展：从 JWT 提取 UserId
│
├── Migrations/                 # EF Core 数据库迁移文件（自动生成）
│
└── Properties/
    └── launchSettings.json     # 开发环境启动配置 (端口 7003)
```

---

## 前端 `frontend/` — Vue 3 + Vite + Tailwind CSS v4

```
frontend/
├── index.html                  # HTML 入口
├── vite.config.js              # Vite 配置：@ 别名、HTTPS、代理 /aicall/api → 后端
├── package.json                # 依赖：Vue 3, Vue Router, lucide-vue-next, recorder-core
├── pnpm-lock.yaml              # pnpm 锁文件
│
├── src/
│   ├── main.js                 # 应用入口：注册 Router、Toast、挂载 App
│   ├── App.vue                 # 根组件：移动端 430px 容器 + 全局背景
│   ├── style.css               # 全局样式 & CSS 变量
│   │
│   ├── router/
│   │   └── index.js            # 路由表 (/login, /home, /chatroom, /history, /history/:id) + 鉴权守卫
│   │
│   ├── api/
│   │   └── index.js            # 所有后端 API 调用函数 (axios 封装)
│   │
│   ├── views/                  # [页面级组件] 每个路由对应一个
│   │   ├── LoginView.vue       #   登录 / 注册页（双面板切换）
│   │   ├── HomeView.vue        #   首页：通话类别选择
│   │   ├── chatroom.vue        #   **核心页面**：实时 AI 语音对话
│   │   ├── HistoryList.vue     #   历史通话记录列表 (分页)
│   │   └── HistoryDetail.vue   #   通话详情 + 消息回放
│   │
│   ├── components/             # [可复用组件]
│   │   ├── VoiceRecorder.vue   #   录音按钮 + VAD 波形可视化
│   │   ├── CustomChat.vue      #   聊天消息气泡组件
│   │   ├── SummaryModal.vue    #   通话结束后的 AI 摘要弹窗
│   │   ├── AppConfirmDialog.vue #  全局确认对话框
│   │   └── DetailSkeleton.vue  #   详情页骨架屏加载态
│   │
│   ├── composables/            # [状态逻辑层] Vue 3 Composition API Hooks — **核心逻辑所在**
│   │   ├── useMicrophone.js    #   麦克风管理：权限、VAD 初始化、音量采样
│   │   ├── useSSEChatStream.js #   SSE 流式对话：fetch + ReadableStream + AbortControl
│   │   ├── useChatMessages.js  #   消息列表状态：增删改 + 自动滚动
│   │   ├── useTypingEffect.js  #   打字机逐字显示特效
│   │   ├── useTTSPlayer.js     #   TTS 音频播放队列管理
│   │   ├── useCallTimer.js     #   通话计时器
│   │   ├── useCallReport.js    #   触发报告生成 + 存储会话
│   │   └── useConfirmDialog.js #   全局确认对话框状态
│   │
│   ├── utils/                  # [工具层] 纯函数 / 配置 / SDK 封装
│   │   ├── request.js          #   Axios 实例：baseURL、Token 注入、错误 Toast
│   │   ├── config.js           #   全局配置：VAD 参数、工作 URL、问候语
│   │   ├── voiceRecognizer.js  #   VAD 录音识别器封装 (recorder-core)
│   │   ├── audioManager.js     #   音频缓冲管理
│   │   ├── llm.js              #   LLM 服务模块：chat() + generateReport()
│   │   ├── toast.js            #   Toast 通知单例
│   │   └── setvh.js            #   移动端视口高度修复
│   │
│   └── assets/                 # 静态资源 (SVG 图标、PNG 图片)
│
├── asr-worker/                 # Cloudflare Worker：ASR 代理中转
│   ├── src/index.js
│   ├── package.json
│   └── wrangler.toml
│
├── asr.md                      # ASR 技术文档
├── tts.md                      # TTS 技术文档
├── demo.html                   # 早期 Demo 原型
└── chatroom/chat.html          # 早期聊天原型
```

---

## 核心数据流 (语音通话闭环)

```
用户说话 → useMicrophone (VAD) → /deal/speechToText (Whisper ASR)
  → 前端追加 customer 消息
  → /conversation/chat-stream (LLM SSE 流式)
  → useSSEChatStream 逐字接收 → useTypingEffect 显示 + useTTSPlayer 播放语音
  → AI 回答完成 → 追加 salesman 消息
  → 循环，直到用户结束通话
  → /conversation/report → LLM 生成 JSON 摘要 → 存入 DB → SummaryModal 展示
```
