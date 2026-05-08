<template>
  <div
    class="relative flex h-[100dvh] flex-col overflow-hidden px-3 pb-3 pt-3"
    :data-scene="sceneType"
  >
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute left-1/2 top-[38%] h-[21rem] w-[21rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        :style="{ background: 'var(--scene-glow)' }"
      ></div>
    </div>

    <div class="relative z-10 flex min-h-0 flex-1 flex-col gap-3">
      <header
        class="rounded-[28px] px-4 py-3 backdrop-blur-2xl"
        :style="{
          background: 'var(--scene-header-bg)',
          borderColor: 'var(--scene-header-border)',
          borderWidth: sceneType === 2 ? '1px' : '0px',
          boxShadow: 'var(--scene-header-shadow)',
        }"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="overflow-hidden rounded-[18px] shadow-[0_8px_24px_rgba(125,211,252,0.18)]"
              :style="{ background: 'var(--scene-avatar-bg)' }"
            >
              <img src="../assets/image/robot.png" alt="AI" class="h-11 w-11 object-cover" />
            </div>
            <div>
              <p
                class="font-[var(--font-display)] text-[2rem] font-semibold leading-none tracking-[0.01em]"
                :style="{ color: 'var(--scene-title)' }"
              >Claudio</p>
              <p
                class="mt-1 text-[12px]"
                :style="{ color: 'var(--scene-subtitle)' }"
              >{{ statusText }}</p>
            </div>
          </div>
          <p
            class="rounded-full px-3 py-1.5 font-[var(--font-mono)] text-[11px] font-medium tracking-[0.24em] shadow-[0_8px_20px_rgba(148,163,184,0.12)]"
            :style="{ background: 'var(--scene-timer-bg)', color: 'var(--scene-timer-text)' }"
          >{{ callTimer }}</p>
        </div>
      </header>

      <main
        ref="messagesRef"
        class="min-h-0 flex-1 overflow-y-auto rounded-[30px] px-3 py-4 backdrop-blur-2xl"
        :style="{
          background: 'var(--scene-msg-bg)',
          boxShadow: 'var(--scene-msg-shadow)',
          borderColor: 'var(--scene-msg-border)',
          borderWidth: sceneType === 2 ? '1px' : '0px',
        }"
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
              class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[16px] shadow-[0_8px_20px_rgba(148,163,184,0.12)]"
              :style="{ background: 'var(--scene-avatar-bg)' }"
            >
              <img src="../assets/image/robot.png" alt="AI" class="h-full w-full object-cover" />
            </div>

            <div class="max-w-[82%]">
              <div
                class="rounded-[22px] px-4 py-3 shadow-[0_10px_24px_rgba(148,163,184,0.1)]"
                :style="{
                  background: msg.role === 'customer' ? 'var(--scene-bubble-user)' : 'var(--scene-bubble-ai)',
                  color: 'var(--scene-bubble-text)',
                }"
              >
                <p class="whitespace-pre-wrap text-[15px] leading-8">{{ msg.content }}</p>
              </div>

              <p
                class="mt-1.5 font-[var(--font-mono)] text-[11px]"
                :class="{ 'text-right': msg.role === 'customer' }"
                :style="{ color: 'var(--scene-time-text)' }"
              >{{ formatTime(msg.timestamp) }}</p>
            </div>
          </article>
        </TransitionGroup>
      </main>

      <section
        class="rounded-[30px] px-4 py-4 backdrop-blur-2xl"
        :style="{
          background: 'var(--scene-ctrl-bg)',
          boxShadow: 'var(--scene-ctrl-shadow)',
          borderColor: 'var(--scene-ctrl-border)',
          borderWidth: sceneType === 2 ? '1px' : '0px',
        }"
      >
        <div class="mb-3 flex items-center justify-between">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.32em]"
            :style="{ color: 'var(--scene-state-label)' }"
          >{{ stateLabel }}</p>
          <span
            class="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.28em]"
            :style="{ color: 'var(--scene-state-tag)' }"
          >{{ state }}</span>
        </div>

        <div
          class="relative flex h-[132px] items-center justify-center overflow-hidden rounded-[26px]"
          :style="{ background: 'var(--scene-viz-bg)' }"
        >
          <div
            class="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
            :style="{ background: 'var(--scene-glow-dot)' }"
          ></div>

          <template v-if="state === 'LISTENING'">
            <div
              class="absolute rounded-full transition-transform duration-75"
              :style="{
                ...microphoneHaloStyle,
                background: 'var(--scene-halo-outer)',
                width: '88px', height: '88px',
              }"
            ></div>
            <div
              class="absolute rounded-full transition-transform duration-75"
              :style="{
                ...microphoneOuterHaloStyle,
                background: 'var(--scene-halo-inner)',
                width: '128px', height: '128px',
              }"
            ></div>
          </template>

          <template v-else-if="state === 'SPEAKING'">
            <WaveformVisualizer
              :volume="ttsVolume"
              :bar-count="48"
              :color="waveformColor"
              class="relative z-10 w-full h-16"
            />
          </template>

          <div
            v-else-if="state === 'WAITING'"
            class="relative h-10 w-40 overflow-hidden rounded-full"
            :style="{ background: 'var(--scene-waiting-bg)' }"
          >
            <div
              class="absolute inset-y-0 left-[-30%] w-[34%] bg-gradient-to-r from-transparent to-transparent blur-sm animate-[waitingGlow_1.4s_linear_infinite]"
              :style="{ '--tw-gradient-via': 'var(--scene-waiting-glow)' }"
            ></div>
          </div>

          <div
            v-else-if="state === 'READY' || state === 'IDLE'"
            class="h-[3px] w-28 rounded-full"
            :style="{
              background: 'var(--scene-ready-bg)',
              boxShadow: 'var(--scene-ready-shadow)',
            }"
          ></div>

          <div v-else class="h-3 w-3 rounded-full bg-slate-300"></div>
        </div>

        <div v-if="state !== 'ENDED'" class="mt-4">
          <button
            class="flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition"
            :style="{
              background: 'var(--scene-btn-end-bg)',
              color: 'var(--scene-btn-end-text)',
            }"
            @click="endCall"
            @mouseenter="$event.target.style.background = 'var(--scene-btn-end-hover)'"
            @mouseleave="$event.target.style.background = 'var(--scene-btn-end-bg)'"
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
            :style="{
              background: 'var(--scene-btn-back-bg)',
              color: 'var(--scene-btn-back-text)',
            }"
            @click="restart"
          >
            <ArrowLeft :size="16" :stroke-width="1.5" />
            <span>Back</span>
          </button>
          <button
            class="flex h-12 items-center justify-center rounded-full text-sm font-semibold transition"
            :style="{
              background: 'var(--scene-btn-summary-bg)',
              color: 'var(--scene-btn-summary-text)',
            }"
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
      :sceneType="sceneType"
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

const router = useRouter();
const route = useRoute();

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
  showReportModal, reportSummary, isGeneratingReport,
  closeReportModal, generateConversationReport,
} = useCallReport();
const {
  recognizer, microphoneVolume, recognizeSpeech, initRecognizer, closeRecognizer,
} = useMicrophone(() => {
  if (state.value === "SPEAKING" || state.value === "WAITING") return;
  setState("LISTENING");
});
const {
  ttsVolume, isAudioTrulyFinished, stopCurrentAudio, playTTSAudio,
} = useTTSPlayer();

// Scene
const sceneType = computed(() => Number(route.query.scene) || 1);
const waveformColor = computed(() => ({ 1: "#0ea5e9", 2: "#fbbf24", 3: "#10b981" }[sceneType.value] || "#0ea5e9"));


// Mic halo (restored pulsing circles)
const microphoneHaloStyle = computed(() => ({
  transform: `scale(${1 + microphoneVolume.value * 0.5})`,
  opacity: Math.min(0.5, 0.12 + microphoneVolume.value * 0.28),
}));

const microphoneOuterHaloStyle = computed(() => ({
  transform: `scale(${1 + microphoneVolume.value * 0.8})`,
  opacity: Math.min(0.3, 0.06 + microphoneVolume.value * 0.16),
}));

// Computed
const statusText = computed(() => {
  const m = { READY: "Ready to begin", GREETING: "Preparing greeting", IDLE: "Awaiting your voice", LISTENING: "Listening now", RECOGNIZING: "Recognizing speech", WAITING: "Thinking", SPEAKING: "AI is speaking", ENDED: "Call ended" };
  return m[state.value] || state.value;
});

const stateLabel = computed(() => {
  const m = { READY: "Ready", IDLE: "Idle", LISTENING: "Listening", WAITING: "Thinking", SPEAKING: "Speaking", ENDED: "Finished" };
  return m[state.value] || "Live";
});

const formatTime = (ts) => new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

// Audio pipeline
const playTTS = async (text, onStart, onEnd, flowToken = stateLock.value) => {
  await playTTSAudio(text, recognizer, state, abortStream, handleVoiceResult, onStart, () => {
    if (isCurrentFlow(flowToken) && isAudioTrulyFinished.value) onEnd?.();
  });
};

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

const startListening = async (flowToken = stateLock.value) => {
  if (state.value === "ENDED" || !isCurrentFlow(flowToken)) return;
  if (recognizer.value?.isRecording) {
    try { await recognizer.value.stop(); } catch (e) { console.warn("[state] cleanup recording failed", e); }
  }
  if (!recognizer.value) await initRecognizer();
  if (state.value === "ENDED" || !isCurrentFlow(flowToken)) return;
  setState("IDLE", flowToken);
  if (recognizer.value) recognizer.value.start(async (r) => await handleVoiceResult(r, flowToken));
};

const handleVoiceResult = async ({ blob, duration, reason }, flowToken = stateLock.value) => {
  if (state.value === "ENDED" || !isCurrentFlow(flowToken)) return;
  if (state.value === "SPEAKING" && (reason === "noVoice" || reason === "maxDuration")) return;
  if (reason === "noVoice" || reason === "maxDuration") { startListening(flowToken); return; }
  if (!blob || blob.size === 0 || duration < 500) { startListening(flowToken); return; }
  stopTyping(); stopCurrentAudio(); abortStream();
  setState("WAITING", flowToken);
  try {
    const text = await recognizeSpeech(blob);
    if (!text?.trim()) { startListening(flowToken); return; }
    addMessage("customer", text);
    await sendToServer(flowToken);
  } catch (error) {
    console.error("ASR failed:", error);
    try {
      const fb = "I'm sorry, I didn't hear you clearly. Could you please repeat it?";
      addMessage("salesman", fb);
      await playTTS(fb, null, async () => {
        if (state.value !== "ENDED" && !recognizer.value?.isRecording && isAudioTrulyFinished.value) await startListening(flowToken);
      }, flowToken);
    } catch {
      startListening(flowToken);
    }
  }
};

const sendToServer = async (flowToken = stateLock.value) => {
  if (state.value === "ENDED" || !isCurrentFlow(flowToken)) return;
  setState("WAITING", flowToken);
  const requestBody = {
    category: route.query.category || "",
    sub_Category: route.query.sub_category || "",
    sceneType: sceneType.value,
    mode: route.query.mode || "",
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

onMounted(() => {
  startCall();
});

onUnmounted(async () => {
  stopCallTimer(); abortStream();
  await closeRecognizer(); stopTyping(); stopCurrentAudio();
});
</script>
