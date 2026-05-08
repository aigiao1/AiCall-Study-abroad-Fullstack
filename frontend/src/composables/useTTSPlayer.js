// src/composables/useTTSPlayer.js
import { ref } from "vue";
import { globalAudioManager } from "../utils/audioManager.js";
import { apiTextToSpeech } from "../api/index.js";
import { detectHuawei } from "../utils/voiceRecognizer.js";

// 全局环境检测：只要查一次就行
const huaweiInfo = detectHuawei();
const isHuaweiDevice = huaweiInfo.isHuawei;

// 这些是模块级单例，避免重复给同一个 audio 元素创建 MediaElementSource
let analyserAudioContext = null;
let analyserNode = null;
let analyserDataArray = null;
let analyserFrameId = 0;
let mediaElementSource = null;

const ensureAudioAnalyser = async (audioEl) => {
  if (analyserNode && mediaElementSource) {
    if (analyserAudioContext?.state === "suspended") {
      await analyserAudioContext.resume();
    }
    return;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  analyserAudioContext = analyserAudioContext || new AudioContextCtor();
  mediaElementSource = mediaElementSource || analyserAudioContext.createMediaElementSource(audioEl);
  analyserNode = analyserNode || analyserAudioContext.createAnalyser();
  analyserNode.fftSize = 256;
  analyserNode.smoothingTimeConstant = 0.82;
  analyserDataArray = analyserDataArray || new Uint8Array(analyserNode.fftSize);

  mediaElementSource.connect(analyserNode);
  analyserNode.connect(analyserAudioContext.destination);
};

const stopVolumeLoop = (ttsVolume) => {
  if (analyserFrameId) {
    cancelAnimationFrame(analyserFrameId);
    analyserFrameId = 0;
  }
  ttsVolume.value = 0;
};

const sampleTtsVolume = (ttsVolume) => {
  if (!analyserNode || !analyserDataArray) return;
  if (analyserAudioContext?.state === "suspended") {
    analyserAudioContext.resume();
  }

  analyserNode.getByteTimeDomainData(analyserDataArray);

  let sum = 0;
  for (let i = 0; i < analyserDataArray.length; i += 1) {
    const normalized = (analyserDataArray[i] - 128) / 128;
    sum += normalized * normalized;
  }

  const rms = Math.sqrt(sum / analyserDataArray.length);
  const boosted = Math.min(1, rms * 7.2);
  ttsVolume.value = ttsVolume.value * 0.72 + boosted * 0.28;

  analyserFrameId = requestAnimationFrame(() => sampleTtsVolume(ttsVolume));
};

// Split text into sentences for sequential TTS playback
const splitSentences = (text) => {
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.filter((s) => s.trim().length > 0);
};

// Fetch TTS audio for a single sentence (with retry for flaky proxy)
const fetchTTSAudio = async (text) => {
  let t = text.trim();
  if (t.length > 200) t = t.substring(0, 200);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const arrayBuffer = await apiTextToSpeech(t);
      return new Blob([arrayBuffer], { type: 'audio/mpeg' });
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
};

export function useTTSPlayer() {
  const ttsVolume = ref(0);
  const isAudioTrulyFinished = ref(false);
  let seqAborted = false;

  const stopCurrentAudio = () => {
    seqAborted = true;
    const audio = globalAudioManager.getAudio();
    if (!audio) return;
    isAudioTrulyFinished.value = false;
    stopVolumeLoop(ttsVolume);
    audio.pause();
    audio.onended = null;
    audio.onerror = null;
    audio.onplay = null;
    audio.onplaying = null;
    audio.onpause = null;
    audio.onwaiting = null;
    audio.onstalled = null;
  };

  const SPLIT_THRESHOLD = 500; // Only split very long responses

  // Sequential sentence-by-sentence TTS with prefetch (for long LLM responses)
  const playTTSSequential = async (
    text,
    recognizerRef,
    stateRef,
    abortStreamFn,
    handleVoiceResultFn,
    onFirstStart,
    onAllEnd,
  ) => {
    if (!text?.trim()) return;
    seqAborted = false;

    // Stop any currently playing audio WITHOUT setting seqAborted
    const audio = globalAudioManager.getAudio();
    if (audio) {
      isAudioTrulyFinished.value = false;
      stopVolumeLoop(ttsVolume);
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      audio.onplay = null;
      audio.onplaying = null;
      audio.onpause = null;
      audio.onwaiting = null;
      audio.onstalled = null;
    }

    // Short text: single TTS call (faster — no per-sentence overhead)
    // Long text: split into sentences, prefetch next while playing
    const segments = text.length > SPLIT_THRESHOLD ? splitSentences(text) : [text];
    if (segments.length === 0) return;

    try {
      const globalAudioInst = globalAudioManager.getAudio();
      await ensureAudioAnalyser(globalAudioInst);

      // Barge-in setup (once, before first sentence)
      if (recognizerRef.value) {
        recognizerRef.value.setBargeInMode(!isHuaweiDevice, () => {
          if (stateRef.value === "ENDED") return;
          seqAborted = true;
          isAudioTrulyFinished.value = false;
          abortStreamFn?.();
          stopCurrentAudio();
          stateRef.value = "LISTENING";
        });
        if (!isHuaweiDevice && !recognizerRef.value.isRecording) {
          recognizerRef.value.start(async (result) => await handleVoiceResultFn(result));
        }
      }

      let isFirst = true;
      let prefetchBlobs = []; // prefetch up to 2 ahead: [idx, blob]

      // Prefetch first 2 segments before playing anything
      for (let j = 0; j < Math.min(2, segments.length) && !seqAborted; j++) {
        fetchTTSAudio(segments[j]).then((blob) => {
          prefetchBlobs.push([j, blob]);
        });
      }

      for (let i = 0; i < segments.length; i++) {
        if (seqAborted || stateRef.value === "ENDED") break;

        // Wait for prefetched blob or fetch now
        let audioBlob;
        const cached = prefetchBlobs.find(([idx]) => idx === i);
        if (cached) {
          audioBlob = cached[1];
          prefetchBlobs = prefetchBlobs.filter(([idx]) => idx !== i);
        } else {
          audioBlob = await fetchTTSAudio(segments[i]);
        }

        // Prefetch segment i+2 while playing segment i
        const ahead = i + 2;
        if (ahead < segments.length && !seqAborted && !prefetchBlobs.some(([idx]) => idx === ahead)) {
          fetchTTSAudio(segments[ahead]).then((blob) => {
            prefetchBlobs.push([ahead, blob]);
          });
        }

        if (seqAborted || stateRef.value === "ENDED") break;

        const audioUrl = URL.createObjectURL(audioBlob);
        globalAudioInst.src = audioUrl;
        globalAudioInst.load();

        await new Promise((resolve) => {
          globalAudioInst.onended = () => { URL.revokeObjectURL(audioUrl); resolve(); };
          globalAudioInst.onerror = () => { URL.revokeObjectURL(audioUrl); resolve(); };
          globalAudioInst.onplay = () => {
            if (isFirst) {
              isFirst = false;
              stopVolumeLoop(ttsVolume);
              sampleTtsVolume(ttsVolume);
              // Pass null — sequential audio can't sync typing to a single segment
              onFirstStart?.(null);
            }
          };
          globalAudioInst.play().catch(() => resolve());
        });
      }

      if (recognizerRef.value && stateRef.value !== "ENDED") {
        recognizerRef.value.setBargeInMode(false, null);
      }
      if (!seqAborted && stateRef.value !== "ENDED") {
        isAudioTrulyFinished.value = true;
        onAllEnd?.();
      }
      if (isHuaweiDevice && recognizerRef.value && stateRef.value !== "ENDED") {
        recognizerRef.value.start(async (result) => await handleVoiceResultFn(result));
      }
    } catch (error) {
      if (recognizerRef.value) recognizerRef.value.setBargeInMode(false, null);
      isAudioTrulyFinished.value = false;
      stopVolumeLoop(ttsVolume);
      throw error;
    }
  };

  const playTTSAudio = async (
    text, recognizerRef, stateRef, abortStreamFn,
    handleVoiceResultFn, onStart, onEnd,
  ) => {
    return playTTSSequential(
      text, recognizerRef, stateRef, abortStreamFn,
      handleVoiceResultFn, onStart, onEnd,
    );
  };

  return {
    ttsVolume,
    isAudioTrulyFinished,
    stopCurrentAudio,
    playTTSAudio,
    playTTSSequential,
  };
}
