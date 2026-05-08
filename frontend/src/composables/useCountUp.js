import { ref, onUnmounted } from "vue"

export function useCountUp() {
  const displayValue = ref(0)
  let rafId = null

  const animate = (target, duration = 1200) => {
    cancelAnimationFrame(rafId)
    const start = performance.now()
    const initial = displayValue.value

    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      displayValue.value = Math.round(initial + (target - initial) * eased)
      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }
    rafId = requestAnimationFrame(tick)
  }

  onUnmounted(() => cancelAnimationFrame(rafId))

  return { displayValue, animate }
}
