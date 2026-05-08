<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, ArrowRight, MessageCircle, Coffee, Plane, Utensils, Building2, Briefcase, GraduationCap } from "lucide-vue-next";
import { CONFIG } from "../utils/config.js";
import { VoiceRecognizerWithVAD } from "../utils/voiceRecognizer.js";
import { globalAudioManager } from "../utils/audioManager.js";
import { notify } from "../utils/toast.js";

const router = useRouter();

const coachMode = ref("roleplay");
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
