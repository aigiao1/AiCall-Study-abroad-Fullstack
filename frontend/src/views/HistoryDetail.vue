<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Mic, Trash2 } from "lucide-vue-next";
import { apiDeleteCallSession, apiGetCallSessionDetail } from "@/api/index";
import { notify } from "@/utils/toast";
import { useConfirmDialog } from "@/composables/useConfirmDialog";
import DetailSkeleton from '@/components/DetailSkeleton.vue'; 
const route = useRoute();
const router = useRouter();
const { openConfirm } = useConfirmDialog();

const sessionInfo = ref({});
const messages = ref([]);
const parsedSummary = ref({});
const loading = ref(false);
const deleting = ref(false);

const sessionIdLabel = computed(() => {
  const id = route.params.id;
  return id != null && id !== "" ? `#${id}` : "";
});

const goBack = () => {
  router.push("/history");
};

const deleteSession = async () => {
  if (deleting.value) return;
  const currentId = route.params.id;
  if (!currentId) return;

  const confirmed = await openConfirm({
    title: "Delete this session?",
    message: "This action is irreversible and will remove the session record from the bright theme history view.",
    confirmText: "Delete",
    cancelText: "Keep it",
    variant: "danger",
  });
  if (!confirmed) return;

  deleting.value = true;
  try {
    await apiDeleteCallSession(currentId);
    notify.success("Delete successfully");
    router.push("/history");
  } catch (error) {
    console.error("Failed to delete session:", error);
    notify.error("Deletion failed, please try again later.");
  } finally {
    deleting.value = false;
  }
};

const formatDetailTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso).slice(0, 19).replace("T", " ");
  }
};

const formatRangeLine = computed(() => {
  const s = sessionInfo.value.startTime;
  const e = sessionInfo.value.endTime;
  if (!s && !e) return "";
  if (s && e) {
    return `${formatDetailTime(s)} - ${formatDetailTime(e)}`;
  }
  return formatDetailTime(s || e);
});

const isSalesman = (role) =>
  role === "salesman" || role === "assistant" || role === "ai";

const summaryRows = computed(() => {
  const p = parsedSummary.value || {};
  return [
    { key: "background", label: "Background", value: p.background },
    { key: "intention", label: "Intention", value: p.intention },
    { key: "needs", label: "Needs", value: p.needs },
    { key: "followUp", label: "Follow-up", value: p.followUp },
  ].filter((row) => row.value);
});

const hasSummary = computed(() => summaryRows.value.length > 0);

const fetchDetail = async () => {
  const currentId = route.params.id;
  loading.value = true;
  try {
    const res = await apiGetCallSessionDetail(currentId);
    const data = res.data;

    sessionInfo.value = data;
    messages.value = data.messages || [];

    if (data.summary) {
      try {
        parsedSummary.value = JSON.parse(data.summary);
      } catch (e) {
        console.error("Summary JSON解析失败，可能存入的数据格式不对:", e);
        parsedSummary.value = {};
      }
    }
  } catch (error) {
    console.error("拉取详情失败:", error);
    notify.error("拉取详情失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <div class="min-h-[100dvh] px-3 pb-3 pt-3">
    <DetailSkeleton v-if="loading" />
    <div class="space-y-3">
      <header class="rounded-[28px] bg-white/72 px-4 py-4 shadow-[0_18px_45px_rgba(148,163,184,0.14)] backdrop-blur-2xl">
        <div class="flex items-start gap-3">
          <button
            type="button"
            @click="goBack"
            class="relative z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/88 shadow-[0_10px_24px_rgba(148,163,184,0.12)] transition hover:text-sky-600"
          >
            <ArrowLeft :size="18" :stroke-width="1.5" class="text-slate-500" />
          </button>
          <div class="space-y-1.5">
            <p class="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-700/70">Session Detail</p>
            <h1 class="font-[var(--font-display)] text-4xl font-semibold leading-none text-slate-900">
              Conversation review
            </h1>
            <p class="text-sm leading-7 text-slate-500">
              <span v-if="sessionIdLabel" class="font-[var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-sky-600">{{ sessionIdLabel }}</span>
              <span class="ml-2">{{ formatRangeLine || "Review session summary and transcript." }}</span>
            </p>
          </div>
        </div>
      </header>

      <main class="space-y-3">
        <div v-if="loading" class="rounded-[26px] bg-white/78 px-4 py-10 text-center text-sm text-slate-500 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
          Loading session detail...
        </div>

        <template v-else>
          <section class="flex flex-wrap gap-2">
            <span class="rounded-full bg-white/88 px-4 py-2 text-sm font-medium text-sky-600 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
              {{ sessionInfo.category || "-" }}
            </span>
            <span class="rounded-full bg-white/88 px-4 py-2 text-sm font-medium text-slate-500 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
              {{ sessionInfo.subCategory || "-" }}
            </span>
          </section>

          <section class="rounded-[28px] bg-white/68 px-4 py-4 shadow-[0_18px_45px_rgba(148,163,184,0.14)] backdrop-blur-2xl">
            <div class="mb-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">AI Summary</p>
              <h2 class="mt-1.5 text-[1.5rem] font-semibold tracking-tight text-slate-900">Structured follow-up insight</h2>
            </div>

            <div v-if="!hasSummary" class="rounded-[22px] bg-white/82 px-4 py-8 text-center text-sm text-slate-500 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
              暂无摘要内容
            </div>

            <div v-else class="space-y-2.5">
              <article
                v-for="row in summaryRows"
                :key="row.key"
                class="rounded-[22px] bg-white/86 px-4 py-4 shadow-[0_10px_24px_rgba(148,163,184,0.08)]"
              >
                <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{{ row.label }}</p>
                <p class="mt-2.5 text-[15px] leading-8 text-slate-600">{{ row.value }}</p>
              </article>
            </div>
          </section>

          <section class="rounded-[28px] bg-white/68 px-4 py-4 shadow-[0_18px_45px_rgba(148,163,184,0.14)] backdrop-blur-2xl">
            <div class="mb-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Transcript</p>
              <h2 class="mt-1.5 text-[1.5rem] font-semibold tracking-tight text-slate-900">Message timeline</h2>
            </div>

            <div v-if="messages.length === 0" class="rounded-[22px] bg-white/82 px-4 py-8 text-center text-sm text-slate-500 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
              暂无消息记录
            </div>

            <div v-else class="space-y-4">
              <article
                v-for="msg in messages"
                :key="msg.id"
                class="flex gap-3"
                :class="{ 'flex-row-reverse': !isSalesman(msg.role) }"
              >
                <span class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[15px] bg-sky-50/88 text-sm font-semibold text-sky-600 shadow-[0_8px_20px_rgba(148,163,184,0.08)]">
                  <img v-if="isSalesman(msg.role)" src="../assets/image/robot.png" alt="" class="h-full w-full object-cover" />
                  <span v-else>U</span>
                </span>
                <div class="max-w-[82%] rounded-[22px] px-4 py-3 shadow-[0_10px_24px_rgba(148,163,184,0.08)]" :class="isSalesman(msg.role) ? 'bg-white/92' : 'bg-sky-50/92'">
                  <p class="text-[15px] leading-8 text-slate-700">{{ msg.content }}</p>
                  <p class="mt-2 font-[var(--font-mono)] text-[11px] text-slate-400">{{ formatDetailTime(msg.timestamp) }}</p>
                </div>
              </article>
            </div>
          </section>
        </template>
      </main>

      <footer class="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          @click="deleteSession"
          :disabled="deleting"
          class="flex h-12 items-center justify-center gap-2 rounded-full bg-rose-500 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(244,63,94,0.2)] transition hover:bg-rose-400 disabled:opacity-60"
        >
          <Trash2 :size="16" :stroke-width="1.5" class="text-white" />
          <span>{{ deleting ? "Deleting..." : "Delete session" }}</span>
        </button>
        <button
          type="button"
          @click="goBack"
          class="flex h-12 items-center justify-center gap-2 rounded-full bg-white/88 text-sm font-semibold text-slate-600 shadow-[0_10px_24px_rgba(148,163,184,0.12)] transition hover:text-sky-600"
        >
          <ArrowLeft :size="16" :stroke-width="1.5" class="text-slate-500" />
          <span>Back to history</span>
        </button>
      </footer>
    </div>
  </div>
</template>
