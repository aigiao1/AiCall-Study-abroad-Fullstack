<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, ChevronLeft, ChevronRight, History, Mic } from "lucide-vue-next";
import { apiGetCallSessions } from "@/api/index";
import { notify } from "@/utils/toast";

const router = useRouter();

const list = ref([]);
const totalItems = ref(0);
const loading = ref(false);
const queryParams = ref({
  PageNumber: 1,
  PageSize: 6,
  Category: "",
});

const totalPages = computed(() => {
  if (totalItems.value <= 0) return null;
  return Math.max(1, Math.ceil(totalItems.value / queryParams.value.PageSize));
});

const canPrev = computed(() => queryParams.value.PageNumber > 1);
const canNext = computed(() => {
  const { PageNumber, PageSize } = queryParams.value;
  if (totalItems.value > 0) {
    return PageNumber * PageSize < totalItems.value;
  }
  return list.value.length >= PageSize;
});

const goHome = () => {
  router.push("/home");
};

const prevPage = () => {
  if (!canPrev.value) return;
  queryParams.value.PageNumber--;
  fetchList();
};

const nextPage = () => {
  if (!canNext.value) return;
  queryParams.value.PageNumber++;
  fetchList();
};

/** 列表时间：短日期 + 时间，避免整行过长 */
const formatListTime = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const t = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (sameDay) return `Today · ${t}`;
    return (
      d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }) + ` · ${t}`
    );
  } catch {
    return String(iso).slice(0, 16).replace("T", " ");
  }
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await apiGetCallSessions(queryParams.value);
    const pageData = res.data;
    list.value = pageData.items ?? [];
    totalItems.value = pageData.totalCount ?? 0;
  } catch (error) {
    console.error("拉取历史记录失败:", error);
    notify.error("拉取历史记录失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

const goToDetail = (id) => {
  router.push(`/history/${id}`);
};

onMounted(() => {
  fetchList();
});
</script>
<template>
  <div class="min-h-[100dvh] px-3 pb-3 pt-3 bg-[#f7fbff]">
    <div class="space-y-3"> <header class="neo-raised rounded-[28px] px-4 py-4"> <div class="flex items-start gap-3">
          <button
            type="button"
            @click="goHome"
            class="neo-raised flex h-11 w-11 items-center justify-center rounded-full active:neo-inset transition-all"
          >
            <ArrowLeft :size="18" :stroke-width="1.5" class="text-slate-500" />
          </button>
          <div class="space-y-1.5">
            <p class="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-700/70">Call Archive</p>
            <h1 class="font-[var(--font-display)] text-4xl font-semibold leading-none text-slate-900">Session history</h1>
            <p class="text-sm leading-7 text-slate-500">Review recent calls in the same soft glass system.</p>
          </div>
        </div>
      </header>

      <section class="neo-raised rounded-[28px] px-3 py-4"> <div class="mb-3 flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Recent Sessions</p>
            <p class="mt-1.5 text-sm text-slate-500">{{ totalItems > 0 ? `${totalItems} total records` : "No records yet" }}</p>
          </div>
          <div class="neo-icon-box flex h-10 w-10 items-center justify-center rounded-full">
            <History :size="17" :stroke-width="1.5" class="text-sky-600" />
          </div>
        </div>

        <div v-if="!loading" class="space-y-2.5">
          <button
            v-for="item in list"
            :key="item.id"
            type="button"
            @click="goToDetail(item.id)"
            class="neo-raised flex w-full items-center gap-3 rounded-[22px] px-4 py-3 text-left transition-all active:scale-[0.98] active:neo-inset"
          >
            <span class="neo-icon-box flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px]">
              <Mic :size="16" :stroke-width="1.5" class="text-sky-600" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[15px] font-semibold text-slate-800">{{ item.category }}</span>
              <span class="mt-1 block truncate text-sm text-slate-400">{{ item.subCategory }}</span>
              <span class="mt-1.5 block truncate font-[var(--font-mono)] text-[11px] text-slate-400">{{ formatListTime(item.startTime) }}</span>
            </span>
            <span v-if="item.messageCount != null" class="neo-inset rounded-full px-3 py-1 font-[var(--font-mono)] text-[10px] font-semibold text-sky-600">
              {{ item.messageCount }}
            </span>
            <ChevronRight :size="17" :stroke-width="1.5" class="text-slate-400" />
          </button>
        </div>
      </section>

      <footer class="grid grid-cols-[48px_1fr_48px] items-center gap-3 rounded-[26px] neo-raised p-3">
        <button
          type="button" @click="prevPage" :disabled="!canPrev"
          class="neo-raised flex h-11 items-center justify-center rounded-full text-slate-500 disabled:opacity-40 active:neo-inset"
        >
          <ChevronLeft :size="18" :stroke-width="1.5" />
        </button>
        <p class="text-center font-[var(--font-mono)] text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {{ queryParams.PageNumber }} / {{ totalPages }}
        </p>
        <button
          type="button" @click="nextPage" :disabled="!canNext"
          class="neo-raised flex h-11 items-center justify-center rounded-full text-slate-500 disabled:opacity-40 active:neo-inset"
        >
          <ChevronRight :size="18" :stroke-width="1.5" />
        </button>
      </footer>
    </div>
  </div>
</template>