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

export function useTTSPlayer() {
  // 真正暴露给界面的 TTS 音量
  const ttsVolume = ref(0);

  // 这个标志位是本次修复的关键：
  // 只有在原生 ended 事件触发后，它才允许变成 true
  const isAudioTrulyFinished = ref(false);

  // 强制让 AI 闭嘴（用于用户打断 / 页面切换 / 挂断）
  const stopCurrentAudio = () => {
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

  // 带真实音量分析 + 真正结束保护的 TTS 播放器
  const playTTSAudio = async (
    text,
    recognizerRef,
    stateRef,
    abortStreamFn,
    handleVoiceResultFn,
    onStart,
    onEnd,
  ) => {
    if (!text || !text.trim()) return;
    if (text.length > 300) text = text.substring(0, 300);

    stopCurrentAudio();
    isAudioTrulyFinished.value = false;

    let isBargedIn = false;
    let audioUrl = "";

    try {
      const globalAudioInst = globalAudioManager.getAudio();
      await ensureAudioAnalyser(globalAudioInst);

      if (recognizerRef.value) {
        // 开启打断监听：只有用户真的打断时，才会立刻停掉音频
        recognizerRef.value.setBargeInMode(!isHuaweiDevice, () => {
          if (stateRef.value === "ENDED") return;
          isBargedIn = true;
          isAudioTrulyFinished.value = false;
          abortStreamFn?.();
          stopCurrentAudio();
          stateRef.value = "LISTENING";
        });

        // 非华为设备：为了支持 barge-in，需要在 TTS 播放期间保留录音链路
        if (!isHuaweiDevice && !recognizerRef.value.isRecording) {
          recognizerRef.value.start(async (result) => await handleVoiceResultFn(result));
        }
      }

      const arrayBuffer = await apiTextToSpeech(text);
      const audioBlob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      audioUrl = URL.createObjectURL(audioBlob);

      globalAudioInst.src = audioUrl;
      globalAudioInst.load();

      return await new Promise((resolve) => {
        let settled = false;

        const cleanup = () => {
          stopVolumeLoop(ttsVolume);
          globalAudioInst.onended = null;
          globalAudioInst.onerror = null;
          globalAudioInst.onplay = null;
          globalAudioInst.onplaying = null;
          globalAudioInst.onpause = null;
          globalAudioInst.onwaiting = null;
          globalAudioInst.onstalled = null;

          if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
          }

          if (stateRef.value !== "ENDED" && recognizerRef.value) {
            recognizerRef.value.setBargeInMode(false, null);
          }
        };

        const finalize = async (shouldComplete) => {
          if (settled) return;
          settled = true;
          cleanup();

          // 只有真正 ended 才允许上层的 completion 回调运行
          if (shouldComplete && !isBargedIn && isAudioTrulyFinished.value) {
            onEnd?.();
          }

          // 华为设备在真正播完之后，才重新回到监听
          if (
            isHuaweiDevice &&
            recognizerRef.value &&
            stateRef.value !== "ENDED" &&
            isAudioTrulyFinished.value
          ) {
            recognizerRef.value.start(async (result) => await handleVoiceResultFn(result));
          }

          resolve();
        };

        globalAudioInst.onplay = () => {
          isAudioTrulyFinished.value = false;
          stopVolumeLoop(ttsVolume);
          sampleTtsVolume(ttsVolume);
          onStart?.(globalAudioInst);
        };

        // buffering、waiting、stalled 都不能视为“播放完毕”
        globalAudioInst.onplaying = () => {
          isAudioTrulyFinished.value = false;
        };

        globalAudioInst.onwaiting = () => {
          isAudioTrulyFinished.value = false;
        };

        globalAudioInst.onstalled = () => {
          isAudioTrulyFinished.value = false;
        };

        globalAudioInst.onpause = () => {
          if (!globalAudioInst.ended) {
            isAudioTrulyFinished.value = false;
          }
        };

        // 只有这里，才真正宣布音频结束
        globalAudioInst.onended = async () => {
          isAudioTrulyFinished.value = true;
          await finalize(true);
        };

        globalAudioInst.onerror = async (error) => {
          console.error("[TTS] 播放错误:", error);
          isAudioTrulyFinished.value = false;
          await finalize(false);
        };

        try {
          const playPromise = globalAudioInst.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(async (error) => {
              console.error("[TTS] 播放启动失败:", error);
              isAudioTrulyFinished.value = false;
              await finalize(false);
            });
          }
        } catch (error) {
          console.error("[TTS] 播放异常:", error);
          isAudioTrulyFinished.value = false;
          finalize(false);
        }
      });
    } catch (error) {
      if (recognizerRef.value) {
        recognizerRef.value.setBargeInMode(false, null);
      }
      isAudioTrulyFinished.value = false;
      stopVolumeLoop(ttsVolume);
      throw error;
    }
  };

  return {
    ttsVolume,            // [输出]：真实 TTS 音量（0-1），用于驱动界面波形
    isAudioTrulyFinished, // [输出]：只有 ended 后才会为 true，用于保护状态回退
    stopCurrentAudio,     // [输入]：强制停止当前 TTS 播放
    playTTSAudio,         // [输入]：播放一段 TTS，并通过真实 ended 控制完成回调
  };
}
