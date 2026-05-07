<script setup>
import { computed } from "vue";
import { useConfirmDialog } from "@/composables/useConfirmDialog";

const { confirmState, closeConfirm } = useConfirmDialog();

const confirmButtonClass = computed(() =>
  confirmState.variant === "danger"
    ? "bg-rose-500 text-white shadow-[0_16px_35px_rgba(244,63,94,0.28)] hover:bg-rose-400"
    : "bg-sky-500 text-white shadow-[0_16px_35px_rgba(56,189,248,0.24)] hover:bg-sky-400",
);
</script>

<template>
  <Transition
    enter-active-class="duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="confirmState.visible"
      class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/18 px-5 backdrop-blur-sm"
      @click="closeConfirm(false)"
    >
      <div
        class="w-full max-w-sm rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(148,163,184,0.28)]"
        @click.stop
      >
        <div class="space-y-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-500/80">
            Confirm Action
          </p>
          <h3 class="text-2xl font-semibold tracking-tight text-slate-900">
            {{ confirmState.title }}
          </h3>
          <p class="text-sm leading-7 text-slate-500">
            {{ confirmState.message }}
          </p>
        </div>

        <div class="mt-7 flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white"
            @click="closeConfirm(false)"
          >
            {{ confirmState.cancelText }}
          </button>
          <button
            type="button"
            class="flex-1 rounded-full px-4 py-3 text-sm font-semibold transition"
            :class="confirmButtonClass"
            @click="closeConfirm(true)"
          >
            {{ confirmState.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
