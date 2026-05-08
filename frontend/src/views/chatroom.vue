<template>
  <div class="relative flex min-h-[100dvh] flex-col overflow-hidden px-3 pb-3 pt-3">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute left-1/2 top-[38%] h-[21rem] w-[21rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.26)_0%,_rgba(125,211,252,0.13)_34%,_transparent_72%)] blur-3xl"></div>
    </div>

    <div class="relative z-10 flex min-h-0 flex-1 flex-col gap-3">
      <header class="rounded-[28px] bg-white/72 px-4 py-3 shadow-[0_18px_45px_rgba(148,163,184,0.14)] backdrop-blur-2xl">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="overflow-hidden rounded-[18px] bg-white/88 shadow-[0_8px_24px_rgba(125,211,252,0.18)]">
              <img src="../assets/image/robot.png" alt="AI" class="h-11 w-11 object-cover" />
            </div>
            <div>
              <p class="font-[var(--font-display)] text-[2rem] font-semibold leading-none tracking-[0.01em] text-slate-900">
                Claudio
              </p>
              <p class="mt-1 text-[12px] text-slate-500">
                {{ statusText }}
              </p>
            </div>
          </div>
          <p class="rounded-full bg-white/84 px-3 py-1.5 font-[var(--font-mono)] text-[11px] font-medium tracking-[0.24em] text-slate-500 shadow-[0_8px_20px_rgba(148,163,184,0.12)]">
            {{ callTimer }}
          </p>
        </div>
      </header>

      <main
        ref="messagesRef"
        class="min-h-0 flex-1 overflow-y-auto rounded-[30px] bg-white/60 px-3 py-4 shadow-[0_18px_45px_rgba(148,163,184,0.12)] backdrop-blur-2xl"
      >
        <TransitionGroup
          tag="div"
          enter-active-class="transform-gpu transition duration-300 ease-out"
          enter-from-class="translate-y-4 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
          class="space-y-4 pb-2"
        >
          <article
            v-for="msg in messages"
            :key="msg.id"
            :id="'msg-' + msg.id"
            class="flex gap-2.5"
            :class="{ 'flex-row-reverse': msg.role === 'customer' }"
          >
            <div
              v-if="msg.role === 'salesman'"
              class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-white/88 shadow-[0_8px_20px_rgba(148,163,184,0.12)]"
            >
              <img src="../assets/image/robot.png" alt="AI" class="h-full w-full object-cover" />
            </div>

            <div class="max-w-[82%]">
              <div
                class="rounded-[22px] px-4 py-3 shadow-[0_10px_24px_rgba(148,163,184,0.1)]"
                :class="
                  msg.role === 'customer'
                    ? 'bg-sky-50/92 text-slate-700'
                    : 'bg-white/94 text-slate-700'
                "
              >
                <p class="whitespace-pre-wrap text-[15px] leading-8">
                  {{ msg.content }}
                </p>
              </div>

              <p
                class="mt-1.5 font-[var(--font-mono)] text-[11px] text-slate-400"
                :class="{ 'text-right': msg.role === 'customer' }"
              >
                {{ formatTime(msg.timestamp) }}
              </p>
            </div>
          </article>
        </TransitionGroup>
      </main>

      <section class="rounded-[30px] bg-white/70 px-4 py-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05),0_18px_45px_rgba(148,163,184,0.14)] backdrop-blur-2xl">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700/70">
            {{ stateLabel }}
          </p>
          <span class="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.28em] text-slate-400">
            {{ state }}
          </span>
        </div>

        <div class="relative flex h-[132px] items-center justify-center overflow-hidden rounded-[26px] bg-white/58">
          <div class="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.18)_0%,_rgba(125,211,252,0.1)_36%,_transparent_72%)] blur-2xl"></div>

          <WaveformVisualizer
            v-if="state === 'LISTENING'"
            :volume="microphoneVolume"
            :bar-count="48"
            color="#10b981"
            class="w-full h-16"
          />

          <div
            v-else-if="state === 'SPEAKING'"
            class="relative flex h-[76px] w-[68%] min-w-[240px] items-end justify-center gap-[5px]"
          >
            <span
              v-for="(barStyle, index) in waveformStyles"
              :key="`bar-${index}`"
              class="flex-1 rounded-full bg-gradient-to-t from-sky-400 via-sky-500 to-indigo-500 shadow-[0_0_18px_rgba(56,189,248,0.2)] transition-all duration-150"
              :style="barStyle"
            ></span>
          </div>

          <div
            v-else-if="state === 'WAITING'"
            class="relative h-10 w-40 overflow-hidden rounded-full bg-sky-50/70"
          >
            <div class="absolute inset-y-0 left-[-30%] w-[34%] bg-gradient-to-r from-transparent via-sky-300/60 to-transparent blur-sm animate-[waitingGlow_1.4s_linear_infinite]"></div>
          </div>

          <div
            v-else-if="state === 'READY' || state === 'IDLE'"
            class="h-[3px] w-28 rounded-full bg-sky-400/60 shadow-[0_0_18px_rgba(56,189,248,0.22)]"
          ></div>

          <div
            v-else
            class="h-3 w-3 rounded-full bg-slate-300"
          ></div>
        </div>

        <div v-if="state !== 'ENDED'" class="mt-4">
          <button
            class="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-900/96 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.16)] transition hover:bg-sky-600"
            @click="endCall"
            title="End call"
            aria-label="End call"
          >
            <PhoneOff :size="16" :stroke-width="1.5" class="text-white" />
            <span>End Call</span>
          </button>
        </div>

        <div v-else class="mt-4 grid grid-cols-2 gap-3">
          <button
            class="flex h-12 items-center justify-center gap-2 rounded-full bg-white/86 text-sm font-semibold text-slate-600 shadow-[0_10px_24px_rgba(148,163,184,0.12)] transition hover:text-sky-600"
            @click="restart"
          >
            <ArrowLeft :size="16" :stroke-width="1.5" class="text-slate-500" />
            <span>Back</span>
          </button>
          <button
            class="flex h-12 items-center justify-center rounded-full bg-slate-900/96 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.16)] transition hover:bg-sky-600"
            @click="showReportModal = true"
          >
            Summary
          </button>
        </div>
      </section>
    </div>

    <SummaryModal
      :visible="showReportModal"
      :summaryData="reportSummary"
      :isLoading="isGeneratingReport"
      @update:visible="showReportModal = $event"
      @confirm="closeReportModal"
      @cancel="closeReportModal"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, PhoneOff } from "lucide-vue-next";
import SummaryModal from "@/components/SummaryModal.vue";
import WaveformVisualizer from "@/components/WaveformVisualizer.vue";
import { useCallReport } from "../composables/useCallReport.js";
import { useCallTimer } from "../composables/useCallTimer.js";
import { useChatMessages } from "../composables/useChatMessages.js";
import { useMicrophone } from "../composables/useMicrophone.js";
import { useSSEChatStream } from "../composables/useSSEChatStream.js";
import { useTTSPlayer } from "../composables/useTTSPlayer.js";
import { useTypingEffect } from "../composables/useTypingEffect.js";

import { CONFIG } from "../utils/config.js";
import { LLMServer } from "../utils/llm.js";
import { VoiceRecognizerWithVAD } from "../utils/voiceRecognizer.js";
import { notify } from "../utils/toast.js";

// Router
const router = useRouter();
const route = useRoute();

// 状态机
const state = ref("READY");
const stateLock = ref("");

const setState = (nextState, lock = stateLock.value) => {
  if (state.value === "ENDED") return;
  if (stateLock.value && lock && lock !== stateLock.value) return;
  state.value = nextState;
};

const createFlowToken = () => {
  const token = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  stateLock.value = token;
  return token;
};

const isCurrentFlow = (token) => stateLock.value === token;

// Composables（能力组件）
const { startTyping, stopTyping } = useTypingEffect();
const { fetchChatStream, abortStream } = useSSEChatStream();
const { callTimer, startCallTimer, stopCallTimer } = useCallTimer();
const { messages, messagesRef, addMessage, updateMessageContent } = useChatMessages();
const {
  showReportModal,
  reportSummary,
  isGeneratingReport,
  closeReportModal,
  generateConversationReport,
} = useCallReport();
const {
  recognizer,
  microphoneVolume,
  recognizeSpeech,
  initRecognizer,
  closeRecognizer,
} = useMicrophone(() => {
  if (state.value === "SPEAKING" || state.value === "WAITING") return;
  setState("LISTENING");
});
const {
  ttsVolume,
  isAudioTrulyFinished,
  stopCurrentAudio,
  playTTSAudio,
} = useTTSPlayer();

// 预先生成 36 根 bar 的随机权重：
// 1. 中间高，两边低（高斯分布）
// 2. 每根 bar 再带一点随机抖动，避免排排坐的机械感
const WAVE_BAR_COUNT = 36;
const waveformProfile = Array.from({ length: WAVE_BAR_COUNT }, (_, index) => {
  const center = (WAVE_BAR_COUNT - 1) / 2;
  const distance = (index - center) / (WAVE_BAR_COUNT * 0.22);
  const gaussian = Math.exp(-(distance * distance) / 2);
  const jitter = 0.82 + Math.random() * 0.36;
  return {
    gaussian,
    jitter,
  };
});

// 做一个轻量平滑值，避免 ttsVolume 每一帧看起来过于抽搐
const smoothedTtsVolume = ref(0);
let waveformFrameId = 0;

const updateWaveSmoothing = () => {
  smoothedTtsVolume.value += (ttsVolume.value - smoothedTtsVolume.value) * 0.24;
  waveformFrameId = requestAnimationFrame(updateWaveSmoothing);
};

// Computed（UI 展示）
const statusText = computed(() => {
  const statusMap = {
    READY: "Ready to begin",
    GREETING: "Preparing greeting",
    IDLE: "Awaiting your voice",
    LISTENING: "Listening now",
    RECOGNIZING: "Recognizing speech",
    WAITING: "Thinking",
    SPEAKING: "AI is speaking",
    ENDED: "Call ended",
  };
  return statusMap[state.value] || state.value;
});

const stateLabel = computed(() => {
  const labelMap = {
    READY: "Ready",
    IDLE: "Idle",
    LISTENING: "Listening",
    WAITING: "Thinking",
    SPEAKING: "Speaking",
    ENDED: "Finished",
  };
  return labelMap[state.value] || "Live";
});

const sceneType = computed(() => Number(route.query.scene) || 1);

const waveformStyles = computed(() =>
  waveformProfile.map(({ gaussian, jitter }) => {
    const energy = Math.max(0.05, smoothedTtsVolume.value);
    const scaled = Math.max(0.1, Math.pow(energy, 0.72) * gaussian * jitter * 1.75);
    return {
      height: "56px",
      transform: `scaleY(${scaled})`,
      transformOrigin: "center bottom",
      opacity: `${0.45 + Math.min(0.48, scaled * 0.55)}`,
    };
  }),
);

// Utils
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 把脏活累活全丢给播音，只留个对讲机
const playTTS = async (text, onStart, onEnd, flowToken = stateLock.value) => {
  await playTTSAudio(
    text,
    recognizer,
    state,
    abortStream,
    handleVoiceResult,
    onStart,
    () => {
      if (isCurrentFlow(flowToken) && isAudioTrulyFinished.value) {
        onEnd?.();
      }
    },
  );
};

// 核心流程：问候 -> 监听 -> 识别 -> 请求 -> 播放 -> 再监听
const playGreeting = async (flowToken) => {
  setState("WAITING", flowToken);
  // 优先使用路由参数传入的 speechText 作为开场白，否则使用默认问候语
  const greeting =
    route.query.speechText ||
    CONFIG.greetings[Math.floor(Math.random() * CONFIG.greetings.length)];

  await playTTS(
    greeting,
    (audioEl) => {
      if (!isCurrentFlow(flowToken)) return;
      setState("SPEAKING", flowToken);
      const currentAiMessageId = addMessage("salesman", " ");
      startTyping(greeting, audioEl, (currentText) => {
        updateMessageContent(currentAiMessageId, currentText);
      });
    },
    async () => {
      if (!isCurrentFlow(flowToken) || state.value === "ENDED" || !isAudioTrulyFinished.value) return;
      await startListening(flowToken);
    },
    flowToken,
  );
};

const startListening = async (flowToken = stateLock.value) => {
  if (state.value === "ENDED" || !isCurrentFlow(flowToken)) return;

  // 1. 如果当前正在录音，仅停止收集当前音频段，严禁销毁硬件级流
  if (recognizer.value && recognizer.value.isRecording) {
    try {
      await recognizer.value.stop();
    } catch (e) {
      console.warn("[状态机] 清理残留录音流失败", e);
    }
  }

  // 2. 仅在实例彻底丢失（如首次加载或异常崩溃）时，才重新向浏览器申请麦克风
  if (!recognizer.value) {
    await initRecognizer();
  }

  // 防止在异步操作间隙，用户已触发挂断
  if (state.value === "ENDED" || !isCurrentFlow(flowToken)) return;

  setState("IDLE", flowToken);

  // 3. 基于已激活的、干净的硬件流，开启新一轮收音
  if (recognizer.value) {
    recognizer.value.start(async (result) => await handleVoiceResult(result, flowToken));
  }
};

const handleVoiceResult = async ({ blob, duration, reason }, flowToken = stateLock.value) => {
  if (state.value === "ENDED" || !isCurrentFlow(flowToken)) return;
  if (state.value === "SPEAKING" && (reason === "noVoice" || reason === "maxDuration")) {
    return;
  }
  if (reason === "noVoice" || reason === "maxDuration") {
    startListening(flowToken);
    return;
  }
  if (!blob || blob.size === 0 || duration < 500) {
    startListening(flowToken);
    return;
  }

  // 强制闭环：正式进入识别前，强制切断可能的残余播放，确保 AI 彻底闭嘴
  stopTyping();
  stopCurrentAudio();

  // 打断任何在途的流式响应，避免“串台”
  abortStream();

  setState("WAITING", flowToken);
  try {
    const text = await recognizeSpeech(blob);
    if (!text || !text.trim()) {
      startListening(flowToken);
      return;
    }
    addMessage("customer", text);
    await sendToServer(flowToken);
  } catch (error) {
    console.error("识别失败:", error);
    const fallbackText = "I'm sorry, I didn't hear you clearly. Could you please repeat it?";
    addMessage("salesman", fallbackText);
    await playTTS(
      fallbackText,
      null,
      async () => {
        if (state.value !== "ENDED" && !recognizer.value?.isRecording && isAudioTrulyFinished.value) {
          await startListening(flowToken);
        }
      },
      flowToken,
    );
  }
};

const sendToServer = async (flowToken = stateLock.value) => {
  if (state.value === "ENDED" || !isCurrentFlow(flowToken)) return;
  setState("WAITING", flowToken);

  const category = route.query.category || "";
  const subCategory = route.query.sub_category || "";
  const requestBody = {
    category,
    sub_Category: subCategory,
    sceneType: sceneType.value,
    conversation: messages.value
      .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content })),
  };

  // 在屏幕上建立一个空的 AI 聊天气泡
  const currentAiMessageId = addMessage("salesman", "");

  await fetchChatStream(
    requestBody,
    () => {},
    async (finalFullText) => {
      if (!isCurrentFlow(flowToken)) return;
      await playTTS(
        finalFullText,
        (audioEl) => {
          if (!isCurrentFlow(flowToken)) return;
          setState("SPEAKING", flowToken);
          startTyping(finalFullText, audioEl, (currentText) => {
            updateMessageContent(currentAiMessageId, currentText);
          });
        },
        async () => {
          if (state.value !== "ENDED" && isAudioTrulyFinished.value) {
            await startListening(flowToken);
          }
        },
        flowToken,
      );
    },
    async (error) => {
      console.error("服务端请求失败:", error);
      const errorText = "Sorry, the service is temporarily unavailable. Please try again in a moment.";
      updateMessageContent(currentAiMessageId, errorText);
      notify.error("Service is temporarily unavailable");
      await playTTS(
        errorText,
        null,
        async () => {
          if (state.value !== "ENDED" && isAudioTrulyFinished.value) {
            await startListening(flowToken);
          }
        },
        flowToken,
      );
    },
  );
};

const startCall = async () => {
  try {
    if (!VoiceRecognizerWithVAD.isSupported()) {
      notify.error("Current browser does not support speech recognition");
      return;
    }
    const flowToken = createFlowToken();
    await initRecognizer();
    startCallTimer();
    LLMServer.reset();
    messages.value = [];
    await playGreeting(flowToken);
  } catch (error) {
    console.error("启动通话失败:", error);
    notify.error(`Start failed: ${error.message}`);
  }
};

const endCall = async () => {
  if (state.value === "ENDED") return;
  stateLock.value = "";
  state.value = "ENDED";
  stopCallTimer();
  stopTyping();
  stopCurrentAudio();
  abortStream();
  await closeRecognizer();
  // 生成通话报告
  generateConversationReport(messages.value, sceneType.value);
};

const restart = () => {
  // 返回首页
  router.push("/home");
};

// Lifecycle
onMounted(() => {
  // 组件挂载后自动开始通话
  startCall();
  waveformFrameId = requestAnimationFrame(updateWaveSmoothing);
});

onUnmounted(async () => {
  if (waveformFrameId) {
    cancelAnimationFrame(waveformFrameId);
  }
  stopCallTimer();
  abortStream();
  await closeRecognizer();
  stopTyping();
  stopCurrentAudio();
});
</script>
