<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, ArrowRight, UserCheck, Users, FileText, ChevronDown, ChevronUp } from "lucide-vue-next";
import { CONFIG } from "../utils/config.js";
import { VoiceRecognizerWithVAD } from "../utils/voiceRecognizer.js";
import { globalAudioManager } from "../utils/audioManager.js";
import { notify } from "../utils/toast.js";

const router = useRouter();

const mode = ref("interviewee");
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
        sub_category: domain.value,
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
