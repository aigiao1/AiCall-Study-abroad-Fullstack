<template>
  <div class="relative flex min-h-[100dvh] flex-col overflow-hidden px-3 pb-3 pt-3" :class="theme.pageBg">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute left-1/2 top-[38%] h-[21rem] w-[21rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" :class="theme.pageGlow"></div>
    </div>

    <div class="relative z-10 flex min-h-0 flex-1 flex-col gap-3">
      <header class="rounded-[28px] px-4 py-3" :class="[theme.headerBg, theme.headerShadow, theme.headerBlur, theme.headerBorder]">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="overflow-hidden rounded-[18px] shadow-[0_8px_24px_rgba(125,211,252,0.18)]" :class="theme.avatarBg">
              <img src="../assets/image/robot.png" alt="AI" class="h-11 w-11 object-cover" />
            </div>
            <div>
              <p class="font-[var(--font-display)] text-[2rem] font-semibold leading-none tracking-[0.01em]" :class="theme.titleColor">Claudio</p>
              <p class="mt-1 text-[12px]" :class="theme.subColor">{{ statusText }}</p>
            </div>
          </div>
          <p class="rounded-full px-3 py-1.5 font-[var(--font-mono)] text-[11px] font-medium tracking-[0.24em] shadow-[0_8px_20px_rgba(148,163,184,0.12)]" :class="[theme.timerBg, theme.timerColor]">{{ callTimer }}</p>
        </div>
      </header>

      <main
        ref="messagesRef"
        class="min-h-0 flex-1 overflow-y-auto rounded-[30px] px-3 py-4" :class="[theme.msgBg, theme.msgShadow, theme.msgBlur]"
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
              class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[16px] shadow-[0_8px_20px_rgba(148,163,184,0.12)]" :class="theme.avatarBg"
            >
              <img src="../assets/image/robot.png" alt="AI" class="h-full w-full object-cover" />
            </div>

            <div class="max-w-[82%]">
              <div
                class="rounded-[22px] px-4 py-3 shadow-[0_10px_24px_rgba(148,163,184,0.1)]"
                :class="msg.role === 'customer' ? theme.bubbleUser : theme.bubbleAi"
              >
                <p class="whitespace-pre-wrap text-[15px] leading-8">
                  {{ msg.content }}
                </p>
              </div>

              <p
                class="mt-1.5 font-[var(--font-mono)] text-[11px]"
                :class="[theme.timeColor, { 'text-right': msg.role === 'customer' }]"
              >
                {{ formatTime(msg.timestamp) }}
              </p>
            </div>
          </article>
        </TransitionGroup>
      </main>

      <section class="rounded-[30px] px-4 py-4" :class="[theme.ctrlBg, theme.ctrlShadow, theme.ctrlBlur]">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-[11px] font-semibold uppercase tracking-[0.32em]" :class="theme.stateLabel">{{ stateLabel }}</p>
          <span class="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.28em]" :class="theme.stateTag">{{ state }}</span>
        </div>

        <div class="relative flex h-[132px] items-center justify-center overflow-hidden rounded-[26px]" :class="theme.vizBg">
          <div class="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" :class="theme.glowDot"></div>

          <!-- LISTENING: halo circles + waveform -->
          <template v-if="state === 'LISTENING'">
            <div class="absolute rounded-full transition-transform duration-75" :style="microphoneHaloStyle" :class="theme.haloOuter"></div>
            <div class="absolute rounded-full transition-transform duration-75" :style="microphoneOuterHaloStyle" :class="theme.haloInner"></div>
            <WaveformVisualizer
              :volume="microphoneVolume"
              :bar-count="48"
              :color="theme.waveformColor"
              class="relative z-10 w-full h-16"
            />
          </template>

          <div
            v-else-if="state === 'SPEAKING'"
            class="relative flex h-[76px] w-[68%] min-w-[240px] items-end justify-center gap-[5px]"
          >
            <span
              v-for="(barStyle, index) in waveformStyles"
              :key="`bar-${index}`"
              class="flex-1 rounded-full transition-all duration-150"
              :class="theme.speakBar"
              :style="barStyle"
            ></span>
          </div>

          <div
            v-else-if="state === 'WAITING'"
            class="relative h-10 w-40 overflow-hidden rounded-full" :class="theme.waitingBar"
          >
            <div class="absolute inset-y-0 left-[-30%] w-[34%] bg-gradient-to-r from-transparent to-transparent blur-sm animate-[waitingGlow_1.4s_linear_infinite]" :class="theme.waitingGlow"></div>
          </div>

          <div
            v-else-if="state === 'READY' || state === 'IDLE'"
            class="h-[3px] w-28 rounded-full" :class="[theme.readyBar, theme.readyShadow]"
          ></div>

          <div
            v-else
            class="h-3 w-3 rounded-full bg-slate-300"
          ></div>
        </div>

        <div v-if="state !== 'ENDED'" class="mt-4">
          <button
            class="flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition"
            :class="[theme.endBtnBg, theme.endBtnText, theme.endBtnHover, theme.endBtnShadow]"
            @click="endCall"
            title="End call"
            aria-label="End call"
          >
            <PhoneOff :size="16" :stroke-width="1.5" />
            <span>End Call</span>
          </button>
        </div>

        <div v-else class="mt-4 grid grid-cols-2 gap-3">
          <button
            class="flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold transition"
            :class="[theme.backBtnBg, theme.backBtnText, theme.backBtnHover]"
            @click="restart"
          >
            <ArrowLeft :size="16" :stroke-width="1.5" />
            <span>Back</span>
          </button>
          <button
            class="flex h-12 items-center justify-center rounded-full text-sm font-semibold transition"
            :class="[theme.summaryBtnBg, theme.summaryBtnText, theme.summaryBtnHover]"
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

// Scene-based theme
const sceneType = computed(() => Number(route.query.scene) || 1);

const theme = computed(() => {
  const themes = {
    1: { // Study Abroad — Sky Blue + Ivory
      pageBg: '',
      pageGlow: 'bg-[radial-gradient(circle,_rgba(56,189,248,0.26)_0%,_rgba(125,211,252,0.13)_34%,_transparent_72%)]',
      headerBg: 'bg-white/72', headerShadow: 'shadow-[0_18px_45px_rgba(148,163,184,0.14)]', headerBlur: 'backdrop-blur-2xl', headerBorder: '',
      avatarBg: 'bg-white/88',
      titleColor: 'text-slate-900', subColor: 'text-slate-500',
      timerBg: 'bg-white/84', timerColor: 'text-slate-500',
      msgBg: 'bg-white/60', msgShadow: 'shadow-[0_18px_45px_rgba(148,163,184,0.12)]', msgBlur: 'backdrop-blur-2xl',
      bubbleUser: 'bg-sky-50/92 text-slate-700', bubbleAi: 'bg-white/94 text-slate-700',
      timeColor: 'text-slate-400',
      ctrlBg: 'bg-white/70', ctrlShadow: 'shadow-[0_-10px_30px_rgba(0,0,0,0.05),0_18px_45px_rgba(148,163,184,0.14)]', ctrlBlur: 'backdrop-blur-2xl',
      stateLabel: 'text-sky-700/70', stateTag: 'text-slate-400',
      vizBg: 'bg-white/58',
      glowDot: 'bg-[radial-gradient(circle,_rgba(56,189,248,0.18)_0%,_rgba(125,211,252,0.1)_36%,_transparent_72%)]',
      haloOuter: 'bg-sky-400/30', haloInner: 'bg-sky-300/20',
      waveformColor: '#0ea5e9',
      speakBar: 'bg-gradient-to-t from-sky-400 via-sky-500 to-indigo-500 shadow-[0_0_18px_rgba(56,189,248,0.2)]',
      waitingBar: 'bg-sky-50/70', waitingGlow: 'via-sky-300/60',
      readyBar: 'bg-sky-400/60', readyShadow: 'shadow-[0_0_18px_rgba(56,189,248,0.22)]',
      endBtnBg: 'bg-slate-900/96', endBtnText: 'text-white', endBtnHover: 'hover:bg-sky-600', endBtnShadow: 'shadow-[0_16px_36px_rgba(15,23,42,0.16)]',
      backBtnBg: 'bg-white/86', backBtnText: 'text-slate-600', backBtnHover: 'hover:text-sky-600',
      summaryBtnBg: 'bg-slate-900/96', summaryBtnText: 'text-white', summaryBtnHover: 'hover:bg-sky-600',
    },
    2: { // Mock Interview — Dark Slate + Amber
      pageBg: 'bg-slate-950',
      pageGlow: 'bg-[radial-gradient(circle,_rgba(251,191,36,0.18)_0%,_rgba(245,158,11,0.08)_34%,_transparent_72%)]',
      headerBg: 'bg-slate-900/80', headerShadow: '', headerBlur: 'backdrop-blur', headerBorder: 'border border-white/10',
      avatarBg: 'bg-white/10',
      titleColor: 'text-white', subColor: 'text-slate-400',
      timerBg: 'bg-white/8', timerColor: 'text-slate-400',
      msgBg: 'bg-slate-900/60', msgShadow: '', msgBlur: 'backdrop-blur', msgBorder: 'border border-white/5',
      bubbleUser: 'bg-amber-400/12 text-slate-200', bubbleAi: 'bg-white/8 text-slate-200',
      timeColor: 'text-slate-500',
      ctrlBg: 'bg-slate-900/80', ctrlShadow: 'shadow-[0_-10px_30px_rgba(0,0,0,0.3)]', ctrlBlur: 'backdrop-blur', ctrlBorder: 'border border-white/10',
      stateLabel: 'text-amber-400/80', stateTag: 'text-slate-500',
      vizBg: 'bg-white/5',
      glowDot: 'bg-[radial-gradient(circle,_rgba(251,191,36,0.22)_0%,_rgba(245,158,11,0.08)_36%,_transparent_72%)]',
      haloOuter: 'bg-amber-400/30', haloInner: 'bg-amber-300/20',
      waveformColor: '#fbbf24',
      speakBar: 'bg-gradient-to-t from-amber-400 via-amber-500 to-orange-500 shadow-[0_0_18px_rgba(251,191,36,0.25)]',
      waitingBar: 'bg-amber-400/10', waitingGlow: 'via-amber-400/40',
      readyBar: 'bg-amber-400/50', readyShadow: 'shadow-[0_0_18px_rgba(251,191,36,0.25)]',
      endBtnBg: 'bg-amber-400', endBtnText: 'text-slate-900', endBtnHover: 'hover:bg-amber-300', endBtnShadow: 'shadow-[0_0_30px_rgba(251,191,36,0.2)]',
      backBtnBg: 'bg-white/8', backBtnText: 'text-slate-300', backBtnHover: 'hover:text-amber-400',
      summaryBtnBg: 'bg-amber-400', summaryBtnText: 'text-slate-900', summaryBtnHover: 'hover:bg-amber-300',
    },
    3: { // English Coach — Mint Green + Warm White
      pageBg: '',
      pageGlow: 'bg-[radial-gradient(circle,_rgba(16,185,129,0.22)_0%,_rgba(52,211,153,0.1)_34%,_transparent_72%)]',
      headerBg: 'bg-gradient-to-br from-emerald-50 to-green-50', headerShadow: 'shadow-[0_18px_45px_rgba(148,163,184,0.14)]', headerBlur: 'backdrop-blur-2xl', headerBorder: 'border border-emerald-200/40',
      avatarBg: 'bg-white/88',
      titleColor: 'text-slate-900', subColor: 'text-slate-500',
      timerBg: 'bg-white/84', timerColor: 'text-slate-500',
      msgBg: 'bg-white/60', msgShadow: 'shadow-[0_18px_45px_rgba(148,163,184,0.12)]', msgBlur: 'backdrop-blur-2xl',
      bubbleUser: 'bg-emerald-50/92 text-slate-700', bubbleAi: 'bg-white/94 text-slate-700',
      timeColor: 'text-slate-400',
      ctrlBg: 'bg-white/70', ctrlShadow: 'shadow-[0_-10px_30px_rgba(0,0,0,0.05),0_18px_45px_rgba(148,163,184,0.14)]', ctrlBlur: 'backdrop-blur-2xl',
      stateLabel: 'text-emerald-700/70', stateTag: 'text-slate-400',
      vizBg: 'bg-white/58',
      glowDot: 'bg-[radial-gradient(circle,_rgba(16,185,129,0.16)_0%,_rgba(52,211,153,0.08)_36%,_transparent_72%)]',
      haloOuter: 'bg-emerald-400/30', haloInner: 'bg-emerald-300/20',
      waveformColor: '#10b981',
      speakBar: 'bg-gradient-to-t from-emerald-400 via-emerald-500 to-teal-500 shadow-[0_0_18px_rgba(16,185,129,0.2)]',
      waitingBar: 'bg-emerald-50/70', waitingGlow: 'via-emerald-300/60',
      readyBar: 'bg-emerald-400/60', readyShadow: 'shadow-[0_0_18px_rgba(16,185,129,0.22)]',
      endBtnBg: 'bg-emerald-500', endBtnText: 'text-white', endBtnHover: 'hover:bg-emerald-600', endBtnShadow: 'shadow-[0_8px_24px_rgba(16,185,129,0.3)]',
      backBtnBg: 'bg-white/86', backBtnText: 'text-slate-600', backBtnHover: 'hover:text-emerald-600',
      summaryBtnBg: 'bg-slate-900/96', summaryBtnText: 'text-white', summaryBtnHover: 'hover:bg-emerald-600',
    },
  };
  return themes[sceneType.value] || themes[1];
});

// State machine
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

// Composables
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

// TTS waveform profile
const WAVE_BAR_COUNT = 36;
const waveformProfile = Array.from({ length: WAVE_BAR_COUNT }, (_, index) => {
  const center = (WAVE_BAR_COUNT - 1) / 2;
  const distance = (index - center) / (WAVE_BAR_COUNT * 0.22);
  const gaussian = Math.exp(-(distance * distance) / 2);
  const jitter = 0.82 + Math.random() * 0.36;
  return { gaussian, jitter };
});

const smoothedTtsVolume = ref(0);
let waveformFrameId = 0;
let waveformActive = true;

const updateWaveSmoothing = () => {
  if (!waveformActive) return;
  smoothedTtsVolume.value += (ttsVolume.value - smoothedTtsVolume.value) * 0.24;
  waveformFrameId = requestAnimationFrame(updateWaveSmoothing);
};

// Mic halo styles (restored pulsing circles)
const microphoneHaloStyle = computed(() => {
  const scale = 1 + microphoneVolume.value * 0.5;
  const opacity = 0.12 + microphoneVolume.value * 0.28;
  return {
    width: '88px', height: '88px',
    transform: `scale(${scale})`,
    opacity: Math.min(0.5, opacity),
  };
});

const microphoneOuterHaloStyle = computed(() => {
  const scale = 1 + microphoneVolume.value * 0.8;
  const opacity = 0.06 + microphoneVolume.value * 0.16;
  return {
    width: '128px', height: '128px',
    transform: `scale(${scale})`,
    opacity: Math.min(0.3, opacity),
  };
});

// Computed
const statusText = computed(() => {
  const map = {
    READY: "Ready to begin", GREETING: "Preparing greeting", IDLE: "Awaiting your voice",
    LISTENING: "Listening now", RECOGNIZING: "Recognizing speech", WAITING: "Thinking",
    SPEAKING: "AI is speaking", ENDED: "Call ended",
  };
  return map[state.value] || state.value;
});

const stateLabel = computed(() => {
  const map = {
    READY: "Ready", IDLE: "Idle", LISTENING: "Listening",
    WAITING: "Thinking", SPEAKING: "Speaking", ENDED: "Finished",
  };
  return map[state.value] || "Live";
});

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

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
};

// TTS playback
const playTTS = async (text, onStart, onEnd, flowToken = stateLock.value) => {
  await playTTSAudio(text, recognizer, state, abortStream, handleVoiceResult, onStart, () => {
    if (isCurrentFlow(flowToken) && isAudioTrulyFinished.value) onEnd?.();
  });
};

// Greeting
const playGreeting = async (flowToken) => {
  setState("WAITING", flowToken);
  const greeting = route.query.speechText || CONFIG.greetings[Math.floor(Math.random() * CONFIG.greetings.length)];
  await playTTS(greeting, (audioEl) => {
    if (!isCurrentFlow(flowToken)) return;
    setState("SPEAKING", flowToken);
    const id = addMessage("salesman", " ");
    startTyping(greeting, audioEl, (t) => updateMessageContent(id, t));
  }, async () => {
    if (!isCurrentFlow(flowToken) || state.value === "ENDED" || !isAudioTrulyFinished.value) return;
    await startListening(flowToken);
  }, flowToken);
};

// Listening
const startListening = async (flowToken = stateLock.value) => {
  if (state.value === "ENDED" || !isCurrentFlow(flowToken)) return;
  if (recognizer.value && recognizer.value.isRecording) {
    try { await recognizer.value.stop(); } catch (e) { console.warn("[state] cleanup recording failed", e); }
  }
  if (!recognizer.value) await initRecognizer();
  if (state.value === "ENDED" || !isCurrentFlow(flowToken)) return;
  setState("IDLE", flowToken);
  if (recognizer.value) recognizer.value.start(async (r) => await handleVoiceResult(r, flowToken));
};

// Voice result handler
const handleVoiceResult = async ({ blob, duration, reason }, flowToken = stateLock.value) => {
  if (state.value === "ENDED" || !isCurrentFlow(flowToken)) return;
  if (state.value === "SPEAKING" && (reason === "noVoice" || reason === "maxDuration")) return;
  if (reason === "noVoice" || reason === "maxDuration") { startListening(flowToken); return; }
  if (!blob || blob.size === 0 || duration < 500) { startListening(flowToken); return; }
  stopTyping(); stopCurrentAudio(); abortStream();
  setState("WAITING", flowToken);
  try {
    const text = await recognizeSpeech(blob);
    if (!text || !text.trim()) { startListening(flowToken); return; }
    addMessage("customer", text);
    await sendToServer(flowToken);
  } catch (error) {
    console.error("ASR failed:", error);
    const fb = "I'm sorry, I didn't hear you clearly. Could you please repeat it?";
    addMessage("salesman", fb);
    await playTTS(fb, null, async () => {
      if (state.value !== "ENDED" && !recognizer.value?.isRecording && isAudioTrulyFinished.value) await startListening(flowToken);
    }, flowToken);
  }
};

// Send to LLM
const sendToServer = async (flowToken = stateLock.value) => {
  if (state.value === "ENDED" || !isCurrentFlow(flowToken)) return;
  setState("WAITING", flowToken);
  const category = route.query.category || "";
  const subCategory = route.query.sub_category || "";
  const mode = route.query.mode || "";
  const requestBody = {
    category, sub_Category: subCategory, sceneType: sceneType.value, mode,
    conversation: messages.value
      .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content })),
  };
  const id = addMessage("salesman", "");
  await fetchChatStream(requestBody, () => {}, async (finalFullText) => {
    if (!isCurrentFlow(flowToken)) return;
    await playTTS(finalFullText, (audioEl) => {
      if (!isCurrentFlow(flowToken)) return;
      setState("SPEAKING", flowToken);
      startTyping(finalFullText, audioEl, (t) => updateMessageContent(id, t));
    }, async () => {
      if (state.value !== "ENDED" && isAudioTrulyFinished.value) await startListening(flowToken);
    }, flowToken);
  }, async (error) => {
    console.error("Server error:", error);
    const et = "Sorry, the service is temporarily unavailable. Please try again in a moment.";
    updateMessageContent(id, et);
    notify.error("Service is temporarily unavailable");
    await playTTS(et, null, async () => {
      if (state.value !== "ENDED" && isAudioTrulyFinished.value) await startListening(flowToken);
    }, flowToken);
  });
};

// Start / End
const startCall = async () => {
  try {
    if (!VoiceRecognizerWithVAD.isSupported()) { notify.error("Browser unsupported"); return; }
    const flowToken = createFlowToken();
    await initRecognizer();
    startCallTimer(); LLMServer.reset(); messages.value = [];
    await playGreeting(flowToken);
  } catch (error) { console.error("Start failed:", error); notify.error(`Start failed: ${error.message}`); }
};

const endCall = async () => {
  if (state.value === "ENDED") return;
  stateLock.value = ""; state.value = "ENDED";
  stopCallTimer(); stopTyping(); stopCurrentAudio(); abortStream();
  await closeRecognizer();
  generateConversationReport(messages.value, sceneType.value);
};

const restart = () => router.push("/home");

// Lifecycle
onMounted(() => {
  waveformActive = true;
  startCall();
  waveformFrameId = requestAnimationFrame(updateWaveSmoothing);
});

onUnmounted(async () => {
  waveformActive = false;
  if (waveformFrameId) { cancelAnimationFrame(waveformFrameId); waveformFrameId = 0; }
  stopCallTimer(); abortStream();
  await closeRecognizer();
  stopTyping(); stopCurrentAudio();
});
</script>
