<script setup>
import AppConfirmDialog from "@/components/AppConfirmDialog.vue";
</script>

<template>
  <div class="relative min-h-[100dvh] overflow-hidden bg-[var(--app-bg)] text-slate-800">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.2),_transparent_28%),linear-gradient(180deg,_#f8fcff_0%,_#eef6ff_45%,_#f9fbff_100%)]"></div>
      <div class="absolute left-1/2 top-[48%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.22)_0%,_rgba(125,211,252,0.1)_28%,_transparent_68%)] blur-2xl"></div>
      <div class="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(180deg,rgba(255,255,255,0.7),transparent)]"></div>
    </div>

    <main class="relative z-10 mx-auto min-h-[100dvh] w-full max-w-[430px]">
      <router-view />
    </main>

    <AppConfirmDialog />
  </div>
</template>
