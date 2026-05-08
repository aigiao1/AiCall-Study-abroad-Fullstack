<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  volume: { type: Number, default: 0 },
  barCount: { type: Number, default: 48 },
  color: { type: String, default: "#10b981" },
});

const canvasRef = ref(null);
let animFrameId = null;
const barHeights = ref([]);
const targetHeights = ref([]);
const DECAY = 0.12;

// Pre-compute center-weight distribution (Gaussian-like)
const weights = [];
for (let i = 0; i < props.barCount; i++) {
  const t = (i - props.barCount / 2) / (props.barCount / 4);
  weights.push(Math.exp(-t * t * 0.8));
}

const draw = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const barWidth = (width / props.barCount) * 0.7;
  const gap = (width / props.barCount) * 0.3;
  const maxBarHeight = height * 0.85;

  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < props.barCount; i++) {
    const w = weights[i];
    const jitter = 0.6 + Math.random() * 0.4;
    let target = props.volume * w * jitter * maxBarHeight;
    if (props.volume > 0.01) {
      target = Math.max(target, maxBarHeight * 0.03 * w * Math.random());
    }
    targetHeights.value[i] = target;

    if (barHeights.value[i] === undefined) barHeights.value[i] = 0;
    barHeights.value[i] += (targetHeights.value[i] - barHeights.value[i]) * DECAY;

    const h = Math.max(1, barHeights.value[i]);
    const x = i * (barWidth + gap) + gap / 2;
    const y = height - h;

    const gradient = ctx.createLinearGradient(x, height, x, y);
    gradient.addColorStop(0, props.color);
    gradient.addColorStop(1, props.color + "88");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, h, [barWidth / 2, barWidth / 2, 2, 2]);
    ctx.fill();
  }

  animFrameId = requestAnimationFrame(draw);
};

const resize = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth * devicePixelRatio;
  canvas.height = parent.clientHeight * devicePixelRatio;
  canvas.style.width = parent.clientWidth + "px";
  canvas.style.height = parent.clientHeight + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(devicePixelRatio, devicePixelRatio);
};

onMounted(() => {
  barHeights.value = new Array(props.barCount).fill(0);
  targetHeights.value = new Array(props.barCount).fill(0);
  resize();
  window.addEventListener("resize", resize);
  animFrameId = requestAnimationFrame(draw);
});

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  window.removeEventListener("resize", resize);
});
</script>

<template>
  <div class="relative w-full h-full min-h-[60px]">
    <canvas ref="canvasRef" class="w-full h-full" />
  </div>
</template>
