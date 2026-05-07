<template>
    <div class="space-y-3 animate-pulse">
      <header class="rounded-[28px] bg-white/50 px-4 py-4 backdrop-blur-2xl">
        <div class="flex items-start gap-3">
          <div class="h-11 w-11 rounded-full bg-slate-200"></div>
          <div class="flex-1 space-y-2 pt-1">
            <div class="h-3 w-20 rounded bg-sky-200/50"></div>
            <div class="h-8 w-48 rounded bg-slate-200"></div>
            <div class="h-4 w-64 rounded bg-slate-100"></div>
          </div>
        </div>
      </header>
  
      <main class="space-y-3">
        <section class="flex gap-2">
          <div class="h-9 w-20 rounded-full bg-white/60"></div>
          <div class="h-9 w-24 rounded-full bg-white/60"></div>
        </section>
  
        <section class="rounded-[28px] bg-white/50 px-4 py-4">
          <div class="mb-4 space-y-2">
            <div class="h-3 w-16 rounded bg-slate-200"></div>
            <div class="h-7 w-56 rounded bg-slate-200"></div>
          </div>
          <div class="space-y-3">
            <div v-for="i in 3" :key="i" class="h-24 rounded-[22px] bg-white/80"></div>
          </div>
        </section>
  
        <section class="rounded-[28px] bg-white/50 px-4 py-4">
          <div class="mb-4 space-y-2">
            <div class="h-3 w-16 rounded bg-slate-200"></div>
            <div class="h-7 w-40 rounded bg-slate-200"></div>
          </div>
          <div class="space-y-6">
            <div class="flex gap-3">
              <div class="h-10 w-10 rounded-[15px] bg-sky-100/50"></div>
              <div class="h-16 w-[70%] rounded-[22px] bg-white/80"></div>
            </div>
            <div class="flex flex-row-reverse gap-3">
              <div class="h-10 w-10 rounded-[15px] bg-slate-200"></div>
              <div class="h-12 w-[50%] rounded-[22px] bg-sky-50/80"></div>
            </div>
            <div class="flex gap-3">
              <div class="h-10 w-10 rounded-[15px] bg-sky-100/50"></div>
              <div class="h-20 w-[80%] rounded-[22px] bg-white/80"></div>
            </div>
          </div>
        </section>
      </main>
  
      <footer class="grid grid-cols-2 gap-3">
        <div class="h-12 rounded-full bg-slate-200"></div>
        <div class="h-12 rounded-full bg-white/60"></div>
      </footer>
    </div>
  </template>