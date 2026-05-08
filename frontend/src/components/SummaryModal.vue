<script setup>
import { computed } from "vue";

const props = defineProps({
  visible: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  summaryData: { type: Object, default: () => ({}) },
  sceneType: { type: Number, default: 1 },
});

const emit = defineEmits(["update:visible", "confirm", "cancel"]);

const labelMap = {
  Topic: "Topic",
  Background: "Background",
  Intention: "Intention",
  Needs: "Key Needs",
  FollowUp: "Follow-up",
  Strengths: "Strengths",
  Improvements: "Areas to Improve",
  Score: "Overall Score",
  Fluency: "Fluency",
  Vocabulary: "Vocabulary",
  Grammar: "Grammar Accuracy",
  Suggestions: "Suggestions",
};

const rows = computed(() => {
  return Object.entries(props.summaryData)
    .filter(([, v]) => v != null && v !== "" && v !== "-")
    .map(([key, value]) => ({
      key,
      label: labelMap[key] || key,
      value,
    }));
});

const sceneStyle = computed(() => {
  const styles = {
    2: { bg: "bg-slate-900/92", card: "bg-amber-400/8", accent: "text-amber-400/80", btn: "bg-amber-400 text-slate-900", title: "text-white", sub: "text-slate-400" },
    3: { bg: "bg-white/92", card: "bg-emerald-50/70", accent: "text-emerald-700/70", btn: "bg-emerald-500 text-white", title: "text-slate-900", sub: "text-slate-500" },
  };
  return styles[props.sceneType] || { bg: "bg-white/92", card: "bg-sky-50/70", accent: "text-sky-700/70", btn: "bg-slate-900/96 text-white", title: "text-slate-900", sub: "text-slate-500" };
});

const handleCancel = () => { emit("update:visible", false); emit("cancel"); };
const handleConfirm = () => { emit("update:visible", false); emit("confirm"); };
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="visible"
      @click="handleCancel"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-sm"
    >
      <div
        @click.stop
        class="w-full max-w-sm rounded-[30px] p-5 shadow-[0_24px_70px_rgba(148,163,184,0.24)] backdrop-blur-2xl"
        :class="sceneStyle.bg"
      >
        <div class="mb-5">
          <p class="text-[11px] font-semibold uppercase tracking-[0.32em]" :class="sceneStyle.accent">Call Summary</p>
          <h3 class="mt-2 font-[var(--font-display)] text-3xl font-semibold leading-none" :class="sceneStyle.title">Session recap</h3>
        </div>

        <div v-if="isLoading" class="flex flex-col items-center justify-center py-10">
          <div class="flex gap-2">
            <div class="h-2.5 w-2.5 rounded-full bg-sky-500 animate-bounce"></div>
            <div class="h-2.5 w-2.5 rounded-full bg-sky-400 animate-bounce [animation-delay:0.12s]"></div>
            <div class="h-2.5 w-2.5 rounded-full bg-sky-300 animate-bounce [animation-delay:0.24s]"></div>
          </div>
          <span class="mt-4 text-sm" :class="sceneStyle.sub">AI is generating the summary...</span>
        </div>

        <div v-else-if="rows.length === 0" class="py-8 text-center text-sm" :class="sceneStyle.sub">
          No summary data available.
        </div>

        <div v-else class="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
          <article
            v-for="row in rows"
            :key="row.key"
            class="rounded-[22px] px-4 py-3"
            :class="sceneStyle.card"
          >
            <p class="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-slate-400">{{ row.label }}</p>
            <div class="mt-2 text-[14px] leading-7 text-slate-600">
              <template v-if="Array.isArray(row.value)">
                <div v-for="(item, i) in row.value" :key="i">{{ item }}</div>
              </template>
              <template v-else>{{ row.value }}</template>
            </div>
          </article>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-3">
          <button
            @click="handleCancel"
            class="flex h-11 items-center justify-center rounded-full bg-white/86 text-sm font-semibold text-slate-600 shadow-[0_10px_24px_rgba(148,163,184,0.12)] transition hover:text-sky-600"
          >Cancel</button>
          <button
            @click="handleConfirm"
            :disabled="isLoading"
            class="flex h-11 items-center justify-center rounded-full text-sm font-semibold shadow-[0_16px_36px_rgba(15,23,42,0.16)] transition disabled:opacity-50"
            :class="sceneStyle.btn"
          >OK</button>
        </div>
      </div>
    </div>
  </Transition>
</template>
