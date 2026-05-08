<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowRight, ArrowLeft, Mic, School, GraduationCap, Wallet, Languages,
} from "lucide-vue-next";
import { CONFIG } from "../utils/config.js";
import { VoiceRecognizerWithVAD } from "../utils/voiceRecognizer.js";
import { globalAudioManager } from "../utils/audioManager.js";
import { notify } from "../utils/toast.js";

const iconMap = {
  taocan: School,
  zhineng: GraduationCap,
  heyue: Wallet,
  weixi: Languages,
};

const router = useRouter();

const activeLevel1Id = ref("level1_01");
const activeLevel2Id = ref("level2_01_01");

const categoryData = ref([
  {
    id: "level1_01",
    title: "School & Major\nSelection",
    iconType: "taocan",
    subCategories: [
      { id: "level2_01_01", title: "Country & School Tier", speechText: "Hello, I am your admissions consultant. To help match you with the right schools, which country are you targeting and what is your current academic background?" },
      { id: "level2_01_02", title: "Major Analysis", speechText: "Hi there! Choosing the right major is crucial. Are you looking into business, STEM, or humanities? Please tell me about your current major." },
      { id: "level2_01_03", title: "Rankings vs. Employment", speechText: "Hello! When evaluating universities, do you prioritize overall QS rankings, or are you more focused on specific program rankings and local job opportunities?" },
    ],
  },
  {
    id: "level1_02",
    title: "Academic\nRequirements",
    iconType: "zhineng",
    subCategories: [
      { id: "level2_02_01", title: "GPA & Transcripts", speechText: "Hello! GPA is a key factor in applications. Could you share your current GPA? If there are any low grades, we can figure out a strategy to address them." },
      { id: "level2_02_02", title: "Language & Test Scores", speechText: "Hi! Have you taken the IELTS, TOEFL, or GRE yet? If not, when are you planning to take these exams?" },
      { id: "level2_02_03", title: "Cross-Major Application", speechText: "Welcome! Are you looking to change your major for your master's degree? Please tell me your current major and the one you wish to pivot to." },
    ],
  },
  {
    id: "level1_03",
    title: "Budget &\nScholarships",
    iconType: "heyue",
    subCategories: [
      { id: "level2_03_01", title: "Overall Budget", speechText: "Hello! Let's talk about budget. Including tuition and living expenses, what is your estimated total budget for studying abroad?" },
      { id: "level2_03_02", title: "Cost by Country", speechText: "Hi! Costs vary greatly by country. For instance, the US and UK are generally more expensive than Asian or European options. Do you have a preference?" },
      { id: "level2_03_03", title: "Scholarship Planning", speechText: "Hello! If you're aiming for scholarships, we need to highlight your strengths. Do you have any standout research, competitions, or work experience?" },
    ],
  },
  {
    id: "level1_04",
    title: "Pre-departure\n& Future",
    iconType: "weixi",
    subCategories: [
      { id: "level2_04_01", title: "Visa Guidance", speechText: "Hi! For the visa application, you will need proof of funds. When will your bank statement and deposit be ready?" },
      { id: "level2_04_02", title: "Accommodation", speechText: "Hello! Regarding living arrangements, do you prefer applying for on-campus housing or renting a student apartment off-campus?" },
      { id: "level2_04_03", title: "Post-Grad Work Visas", speechText: "Hi! It's great to think ahead. Are you planning to seek employment and stay in the host country after graduation, or return home immediately?" },
    ],
  },
]);

const handleLevel1Click = (item) => {
  activeLevel1Id.value = item.id;
  if (item.subCategories && item.subCategories.length > 0) {
    activeLevel2Id.value = item.subCategories[0].id;
  }
};

const currentSubCategories = computed(() => {
  const activeCategory = categoryData.value.find((cat) => cat.id === activeLevel1Id.value);
  return activeCategory ? activeCategory.subCategories : [];
});

const currentSpeechText = computed(() => {
  const activeSub = currentSubCategories.value.find((sub) => sub.id === activeLevel2Id.value);
  return activeSub ? activeSub.speechText : "";
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
    const activeCategory = categoryData.value.find((cat) => cat.id === activeLevel1Id.value);
    const activeSubCategory = activeCategory?.subCategories.find((sub) => sub.id === activeLevel2Id.value);
    router.push({
      path: "/chatroom",
      query: {
        scene: "1",
        category: activeCategory?.title?.replace(/\n/g, "") || "",
        sub_category: activeSubCategory?.title || "",
        speechText: activeSubCategory?.speechText || "",
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
      <header class="neo-raised rounded-[28px] px-4 py-4">
        <button type="button" @click="goBack" class="neo-raised flex h-11 w-11 items-center justify-center rounded-full active:neo-inset transition-all mb-3">
          <ArrowLeft :size="18" :stroke-width="1.5" class="text-slate-500" />
        </button>
        <p class="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-700/70">Study Abroad AI</p>
        <h1 class="mt-2 font-[var(--font-display)] text-[2.85rem] font-semibold leading-[0.88] tracking-[0.01em] text-slate-900">Admissions</h1>
        <p class="font-[var(--font-display)] text-[2rem] leading-none text-slate-900/92">Consultant</p>
        <p class="mt-2.5 text-[14px] leading-7 text-slate-500">Select a topic and start your voice consultation.</p>
      </header>

      <section class="rounded-[28px] bg-[#f7fbff] px-3 py-4 shadow-none">
        <div class="mb-4 px-1">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700/60">Conversation Scope</p>
          <h2 class="mt-0.5 text-[1.4rem] font-bold tracking-tight text-slate-900">Choose a topic</h2>
        </div>
        <nav class="grid grid-cols-2 gap-2.5">
          <button
            v-for="item in categoryData" :key="item.id" @click="handleLevel1Click(item)"
            class="flex min-h-[90px] flex-col items-start justify-between rounded-[22px] p-3 transition-all duration-200"
            :class="activeLevel1Id === item.id ? 'neo-inset' : 'neo-raised active:scale-95'"
          >
            <span class="flex h-8 w-8 items-center justify-center rounded-[12px]" :class="activeLevel1Id === item.id ? 'bg-sky-500 text-white shadow-inner' : 'neo-icon-box text-sky-600'">
              <component :is="iconMap[item.iconType]" :size="16" stroke-width="2" />
            </span>
            <span class="block text-[13.5px] font-bold whitespace-pre-line" :class="activeLevel1Id === item.id ? 'text-sky-800' : 'text-slate-700'">{{ item.title }}</span>
          </button>
        </nav>
        <div class="mt-5 space-y-2.5">
          <button
            v-for="sub in currentSubCategories" :key="sub.id" @click="activeLevel2Id = sub.id"
            class="group relative flex w-full items-center justify-between rounded-[20px] px-4 py-3 transition-all duration-200"
            :class="activeLevel2Id === sub.id ? 'neo-inset' : 'neo-raised active:scale-[0.98]'"
          >
            <span class="flex min-w-0 items-center gap-3">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px]" :class="activeLevel2Id === sub.id ? 'bg-sky-500 text-white' : 'neo-icon-box text-sky-500'">
                <Mic :size="16" :stroke-width="2.5" />
              </span>
              <span class="min-w-0 text-left">
                <span class="block truncate text-[14px] font-bold" :class="activeLevel2Id === sub.id ? 'text-sky-800' : 'text-slate-700'">{{ sub.title }}</span>
                <span class="block truncate font-[var(--font-mono)] text-[9px] uppercase text-slate-400">Preset Reply</span>
              </span>
            </span>
            <ArrowRight :size="14" :stroke-width="3" class="transition-all" :class="activeLevel2Id === sub.id ? 'text-sky-500 translate-x-1' : 'text-slate-300'" />
          </button>
        </div>
      </section>

      <section class="neo-raised rounded-[28px] bg-white/80 px-4 py-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700/70">Opening Speech</p>
        <p class="mt-2.5 text-[14px] leading-8 text-slate-600">"{{ currentSpeechText }}"</p>
      </section>

      <button
        type="button" @click="startCall"
        class="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-slate-900/96 text-[15px] font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.16)] transition hover:bg-sky-600 active:scale-[0.98]"
      >
        <Mic :size="16" :stroke-width="1.5" class="text-white" />
        <span>Start AI Call</span>
      </button>
    </div>
  </div>
</template>
