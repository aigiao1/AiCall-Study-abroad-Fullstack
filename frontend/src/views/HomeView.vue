<script setup>
import { useRouter } from "vue-router";
import { BarChart3, History, GraduationCap, UserCheck, Globe, ArrowRight } from "lucide-vue-next";

const router = useRouter();

const scenarios = [
  {
    id: "study-abroad",
    icon: GraduationCap,
    title: "Study Abroad\nAdvisor",
    desc: "School selection · Academics · Budget · Visa",
    gradient: "from-sky-50 to-blue-50",
    border: "border-sky-200/60",
    accent: "text-sky-600",
    bg: "bg-sky-50",
    route: "/study-abroad",
  },
  {
    id: "interview",
    icon: UserCheck,
    title: "Mock\nInterview",
    desc: "Be interviewed · Interview others · Practice mode",
    gradient: "from-amber-50 to-yellow-50",
    border: "border-amber-200/60",
    accent: "text-amber-600",
    bg: "bg-amber-50",
    route: "/interview",
  },
  {
    id: "english",
    icon: Globe,
    title: "English\nCoach",
    desc: "Roleplay · Grammar fix · Free conversation",
    gradient: "from-emerald-50 to-green-50",
    border: "border-emerald-200/60",
    accent: "text-emerald-600",
    bg: "bg-emerald-50",
    route: "/english-coach",
  },
];

const goDashboard = () => router.push({ name: "Dashboard" });
const goHistory = () => router.push({ name: "HistoryList" });
</script>

<template>
  <div class="min-h-[100dvh] px-3 pb-3 pt-3">
    <div class="space-y-3">
      <header class="neo-raised rounded-[28px] px-4 py-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-700/70">
              AI Concierge
            </p>
            <h1 class="mt-2 font-[var(--font-display)] text-[2.95rem] font-semibold leading-[0.88] tracking-[0.01em] text-slate-900">
              Choose a
            </h1>
            <p class="font-[var(--font-display)] text-[2rem] leading-none text-slate-900/92">
              Service
            </p>
            <p class="mt-2.5 max-w-[15rem] text-[14px] leading-7 text-slate-500">
              Select an AI assistant and start your voice session.
            </p>
          </div>
          <div class="shrink-0 rounded-[24px] bg-white/82 p-2 shadow-[0_12px_28px_rgba(148,163,184,0.12)]">
            <img src="../assets/image/robot.png" alt="AI Robot" class="h-16 w-16 rounded-[18px] object-cover" />
          </div>
        </div>
      </header>

      <section class="space-y-3">
        <button
          v-for="s in scenarios"
          :key="s.id"
          type="button"
          @click="router.push(s.route)"
          class="neo-raised flex w-full items-center gap-4 rounded-[24px] p-4 text-left transition-all active:scale-[0.98] active:neo-inset"
          :class="`bg-gradient-to-br ${s.gradient} border ${s.border}`"
        >
          <span class="neo-icon-box flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]" :class="[s.accent, s.bg]">
            <component :is="s.icon" :size="22" stroke-width="1.5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-[18px] font-bold leading-tight text-slate-800 whitespace-pre-line">{{ s.title }}</span>
            <span class="mt-1 block text-[12px] text-slate-500">{{ s.desc }}</span>
          </span>
          <ArrowRight :size="18" stroke-width="1.5" class="shrink-0 text-slate-300" />
        </button>
      </section>

      <div class="flex items-center gap-2.5">
        <button type="button" @click="goDashboard" class="neo-raised flex h-9 flex-1 items-center justify-center gap-2 rounded-full px-3.5 text-xs font-semibold text-sky-600 transition-all active:scale-95">
          <BarChart3 :size="14" stroke-width="2" class="text-sky-500" />
          <span>Dashboard</span>
        </button>
        <button type="button" @click="goHistory" class="neo-raised flex h-9 flex-1 items-center justify-center gap-2 rounded-full px-3.5 text-xs font-semibold text-slate-600 transition-all active:scale-95">
          <History :size="14" stroke-width="2" class="text-slate-400" />
          <span>History</span>
        </button>
      </div>
    </div>
  </div>
</template>
