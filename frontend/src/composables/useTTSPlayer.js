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

// Fetch TTS audio for a single sentence
const fetchTTSAudio = async (text) => {
  let t = text.trim();
  if (t.length > 200) t = t.substring(0, 200);
  const arrayBuffer = await apiTextToSpeech(t);
  return new Blob([arrayBuffer], { type: 'audio/mpeg' });
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

  // Sequential sentence-by-sentence TTS with prefetch (the main optimization)
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
    stopCurrentAudio();
    isAudioTrulyFinished.value = false;

    const sentences = splitSentences(text);
    if (sentences.length === 0) return;

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
      let prefetchBlob = null;
      let prefetchIdx = -1;

      for (let i = 0; i < sentences.length; i++) {
        if (seqAborted || stateRef.value === "ENDED") break;

        // Use prefetched blob or fetch now
        let audioBlob;
        if (prefetchIdx === i) {
          audioBlob = prefetchBlob;
          prefetchBlob = null;
        } else {
          audioBlob = await fetchTTSAudio(sentences[i]);
        }

        // Prefetch next sentence while current plays
        if (i + 1 < sentences.length && !seqAborted) {
          const nextIdx = i + 1;
          fetchTTSAudio(sentences[nextIdx]).then((blob) => {
            prefetchBlob = blob;
            prefetchIdx = nextIdx;
          });
        }

        if (seqAborted || stateRef.value === "ENDED") break;

        const audioUrl = URL.createObjectURL(audioBlob);
        globalAudioInst.src = audioUrl;
        globalAudioInst.load();

        await new Promise((resolve) => {
          globalAudioInst.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          globalAudioInst.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          globalAudioInst.onplay = () => {
            if (isFirst) {
              isFirst = false;
              stopVolumeLoop(ttsVolume);
              sampleTtsVolume(ttsVolume);
              onFirstStart?.(globalAudioInst);
            }
          };
          globalAudioInst.play().catch(() => resolve());
        });
      }

      // Cleanup
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

  // Original single-segment TTS (kept for greetings and short responses)
  const playTTSAudio = async (
    text,
    recognizerRef,
    stateRef,
    abortStreamFn,
    handleVoiceResultFn,
    onStart,
    onEnd,
  ) => {
    // Use sequential playback for everything — automatically handles short texts too
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
