<script setup>
import { ref, onMounted, computed, nextTick } from "vue"
import { useRouter } from "vue-router"
import {
  PhoneCall, Clock, CalendarDays, Activity,
  ArrowRight, ChevronRight, BarChart3, PieChart,
  ArrowLeft
} from "lucide-vue-next"
import VueApexCharts from "vue3-apexcharts"
import { apiGetDashboardStats } from "@/api/index"
import { useCountUp } from "@/composables/useCountUp"

const router = useRouter()
const loading = ref(true)
const stats = ref(null)

const todayLabel = computed(() => {
  const d = new Date()
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
})

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "0m"
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hrs > 0) return `${hrs}h ${mins}m`
  return `${mins}m`
}

const formatNumber = (n) => n?.toLocaleString() ?? "0"

const totalCallsCount = useCountUp()
const weeklyCallsCount = useCountUp()
const durationCount = useCountUp()

const statCards = computed(() => [
  { icon: PhoneCall, label: "Total Calls", ref: totalCallsCount, raw: stats.value?.totalCalls ?? 0, format: formatNumber, color: "text-sky-600", bgClass: "bg-sky-50" },
  { icon: Clock, label: "Total Duration", ref: durationCount, raw: Math.round(stats.value?.totalDurationSeconds ?? 0), format: (v) => formatDuration(v), color: "text-violet-600", bgClass: "bg-violet-50" },
  { icon: CalendarDays, label: "This Week", ref: weeklyCallsCount, raw: stats.value?.weeklyCalls ?? 0, format: formatNumber, color: "text-emerald-600", bgClass: "bg-emerald-50" }
])

const donutOptions = computed(() => {
  const data = stats.value?.categoryDistribution ?? []
  return {
    chart: { type: "donut", height: 200, toolbar: { show: false }, animations: { enabled: true, easing: "easeinout", speed: 800 } },
    labels: data.map(d => d.category), series: data.map(d => d.count),
    colors: ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#f97316", "#06b6d4"],
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "58%", labels: { show: true, total: { show: true, label: "Total", fontSize: "13px", fontFamily: "Plus Jakarta Sans", fontWeight: 600, color: "#64748b", formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0) }, value: { fontSize: "22px", fontFamily: "JetBrains Mono", fontWeight: 700, color: "#0f172a", formatter: (val) => val } } }, expandOnClick: false } },
    stroke: { width: 3, colors: ["#f7fbff"] },
    legend: { position: "bottom", fontSize: "12px", fontFamily: "Plus Jakarta Sans", fontWeight: 500, markers: { width: 10, height: 10, radius: 6 }, itemMargin: { horizontal: 12, vertical: 4 } },
    tooltip: { y: { formatter: (val) => `${val} calls` }, style: { fontSize: "13px", fontFamily: "Plus Jakarta Sans" } }
  }
})

const donutEmpty = computed(() => ({ ...donutOptions.value, series: [1], labels: ["No data"], colors: ["#e2e8f0"] }))

const barOptions = computed(() => {
  const trend = stats.value?.weeklyTrend ?? []
  return {
    chart: { type: "bar", height: 180, toolbar: { show: false }, animations: { enabled: true, easing: "easeout", speed: 900 } },
    series: [{ name: "Calls", data: trend.map(d => d.count) }],
    colors: [({ value }) => { const ratio = value / Math.max(...trend.map(d => d.count), 1); return ratio > 0.6 ? "#0ea5e9" : "#7dd3fc" }],
    plotOptions: { bar: { borderRadius: 8, borderRadiusApplication: "end", columnWidth: "50%", dataLabels: { position: "top" } } },
    dataLabels: { enabled: true, offsetY: -4, style: { fontSize: "10px", fontFamily: "JetBrains Mono", fontWeight: 600, colors: ["#64748b"] }, formatter: (val) => val > 0 ? val : "" },
    grid: { borderColor: "rgba(148,163,184,0.12)", strokeDashArray: 4, padding: { top: 8, bottom: 0, left: 0, right: 0 } },
    xaxis: { categories: trend.map(d => d.date), labels: { style: { fontSize: "10px", fontFamily: "JetBrains Mono", fontWeight: 500, colors: "#94a3b8" } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { show: false, min: 0, tickAmount: 3 },
    tooltip: { y: { formatter: (val) => `${val} call${val !== 1 ? "s" : ""}` }, style: { fontSize: "13px", fontFamily: "Plus Jakarta Sans" } }
  }
})

const barEmpty = computed(() => ({ ...barOptions.value, series: [{ name: "Calls", data: [0, 0, 0, 0, 0, 0, 0] }] }))

const fetchStats = async () => {
  loading.value = true
  try {
    const res = await apiGetDashboardStats()
    stats.value = res.data
    await nextTick()
    totalCallsCount.animate(stats.value.totalCalls ?? 0)
    weeklyCallsCount.animate(stats.value.weeklyCalls ?? 0)
    durationCount.animate(Math.round(stats.value.totalDurationSeconds ?? 0))
  } catch { /* ignore */ }
  finally { loading.value = false }
}

const goBack = () => router.push("/home")
const goToDetail = (id) => router.push(`/history/${id}`)
const goToHistory = () => router.push({ name: "HistoryList" })

onMounted(fetchStats)
</script>

<template>
  <div class="min-h-[100dvh] bg-[var(--app-bg)] px-3 pb-3 pt-3">
    <template v-if="loading">
      <div class="space-y-3 animate-pulse">
        <header class="rounded-[28px] bg-white/50 px-4 py-4">
          <div class="h-11 w-11 rounded-full bg-slate-200 mb-3"></div>
          <div class="h-3 w-20 rounded bg-slate-200 mb-3"></div>
          <div class="h-9 w-48 rounded bg-slate-200 mb-2"></div>
          <div class="h-4 w-36 rounded bg-slate-100"></div>
        </header>
        <div class="grid grid-cols-3 gap-2.5">
          <div v-for="i in 3" :key="i" class="rounded-[22px] bg-white/60 p-3.5 space-y-2">
            <div class="h-8 w-8 rounded-[12px] bg-slate-200"></div>
            <div class="h-3 w-14 rounded bg-slate-200"></div>
            <div class="h-6 w-10 rounded bg-slate-200"></div>
          </div>
        </div>
        <div class="rounded-[28px] bg-white/50 p-4 space-y-3">
          <div class="h-3 w-24 rounded bg-slate-200"></div>
          <div class="h-48 rounded-[22px] bg-white/80"></div>
        </div>
        <div class="rounded-[28px] bg-white/50 p-4 space-y-3">
          <div class="h-3 w-24 rounded bg-slate-200"></div>
          <div class="h-36 rounded-[22px] bg-white/80"></div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="space-y-3">
        <header class="neo-raised rounded-[28px] px-4 py-4">
          <button type="button" @click="goBack" class="neo-raised flex h-11 w-11 items-center justify-center rounded-full active:neo-inset transition-all mb-3">
            <ArrowLeft :size="18" :stroke-width="1.5" class="text-slate-500" />
          </button>
          <p class="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-700/70">Analytics</p>
          <h1 class="mt-2 font-[var(--font-display)] text-[2.95rem] font-semibold leading-[0.88] tracking-[0.01em] text-slate-900">Your Dashboard</h1>
          <p class="mt-2.5 text-[14px] leading-7 text-slate-500">{{ todayLabel }}</p>
        </header>

        <section class="grid grid-cols-3 gap-2.5">
          <article v-for="(card, idx) in statCards" :key="idx" class="neo-raised rounded-[22px] p-3.5 flex flex-col justify-between min-h-[115px]">
            <div>
              <span class="neo-icon-box inline-flex h-8 w-8 items-center justify-center rounded-[12px]" :class="card.bgClass">
                <component :is="card.icon" :size="15" stroke-width="2" :class="card.color" />
              </span>
            </div>
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-tight mt-2">{{ card.label }}</p>
            <p class="font-[var(--font-mono)] text-lg font-semibold tracking-tight text-slate-900 mt-1">{{ card.format(card.ref.displayValue.value) }}</p>
          </article>
        </section>

        <section class="neo-raised rounded-[28px] px-4 py-4">
          <div class="mb-1 flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Distribution</p>
              <h2 class="mt-1 text-[1.3rem] font-bold tracking-tight text-slate-900">Call categories</h2>
            </div>
            <span class="neo-icon-box flex h-9 w-9 items-center justify-center rounded-[12px]"><PieChart :size="16" stroke-width="2" class="text-sky-500" /></span>
          </div>
          <VueApexCharts v-if="stats?.categoryDistribution?.length > 0" :options="donutOptions" :series="donutOptions.series" type="donut" height="260" />
          <VueApexCharts v-else :options="donutEmpty" :series="donutEmpty.series" type="donut" height="260" />
        </section>

        <section class="neo-raised rounded-[28px] px-4 py-4">
          <div class="mb-1 flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Trend</p>
              <h2 class="mt-1 text-[1.3rem] font-bold tracking-tight text-slate-900">Weekly activity</h2>
            </div>
            <span class="neo-icon-box flex h-9 w-9 items-center justify-center rounded-[12px]"><BarChart3 :size="16" stroke-width="2" class="text-sky-500" /></span>
          </div>
          <VueApexCharts v-if="stats?.weeklyTrend?.length > 0" :options="barOptions" :series="barOptions.series" type="bar" height="200" />
          <VueApexCharts v-else :options="barEmpty" :series="barEmpty.series" type="bar" height="200" />
        </section>

        <section class="neo-raised rounded-[28px] px-4 py-4">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Recent</p>
              <h2 class="mt-1 text-[1.3rem] font-bold tracking-tight text-slate-900">Latest sessions</h2>
            </div>
            <button type="button" @click="goToHistory" class="neo-raised flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[11px] font-semibold text-slate-500 transition active:scale-95">
              <span>All</span><ArrowRight :size="12" stroke-width="2" />
            </button>
          </div>
          <div v-if="stats?.recentSessions?.length > 0" class="space-y-2">
            <button v-for="s in stats.recentSessions" :key="s.id" type="button" @click="goToDetail(s.id)" class="neo-raised flex w-full items-center gap-3 rounded-[20px] px-3.5 py-3 text-left transition-all active:scale-[0.98] active:neo-inset">
              <span class="neo-icon-box flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px]"><Activity :size="15" stroke-width="2" class="text-sky-500" /></span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[14px] font-semibold text-slate-800">{{ s.category || "Uncategorized" }}</span>
                <span class="mt-0.5 block truncate text-[13px] text-slate-400">{{ s.subCategory || "" }}</span>
              </span>
              <span class="shrink-0 font-[var(--font-mono)] text-[11px] text-slate-400">{{ s.startTime ? new Date(s.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "" }}</span>
              <ChevronRight :size="15" stroke-width="1.5" class="shrink-0 text-slate-300" />
            </button>
          </div>
          <div v-else class="flex h-24 items-center justify-center rounded-[22px] bg-white/70 text-sm text-slate-400">No calls yet. Start your first consultation!</div>
        </section>

        <div class="h-2"></div>
      </div>
    </template>
  </div>
</template>

<style>
.apexcharts-tooltip {
  border-radius: 12px !important;
  box-shadow: 0 8px 24px rgba(148, 163, 184, 0.25) !important;
  border: 1px solid rgba(148, 163, 184, 0.15) !important;
}
</style>
