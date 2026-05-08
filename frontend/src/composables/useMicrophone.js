// src/composables/useMicrophone.js
import { ref } from "vue";
import { VoiceRecognizerWithVAD } from "../utils/voiceRecognizer.js";
import { uploadVoice1 } from "../api/index.js";
import { CONFIG } from "../utils/config.js";

let meterAudioContext = null;
let meterAnalyser = null;
let meterDataArray = null;
let meterStream = null;
let meterFrameId = 0;

const stopVolumeLoop = (microphoneVolume) => {
  if (meterFrameId) {
    cancelAnimationFrame(meterFrameId);
    meterFrameId = 0;
  }
  microphoneVolume.value = 0;
};

const sampleMicrophoneVolume = (microphoneVolume) => {
  if (!meterAnalyser || !meterDataArray) return;

  meterAnalyser.getByteTimeDomainData(meterDataArray);

  let sum = 0;
  for (let i = 0; i < meterDataArray.length; i += 1) {
    const normalized = (meterDataArray[i] - 128) / 128;
    sum += normalized * normalized;
  }

  const rms = Math.sqrt(sum / meterDataArray.length);
  const boosted = Math.min(1, rms * 5.5);
  microphoneVolume.value = microphoneVolume.value * 0.72 + boosted * 0.28;

  meterFrameId = requestAnimationFrame(() => sampleMicrophoneVolume(microphoneVolume));
};

const releaseMeter = async (microphoneVolume) => {
  stopVolumeLoop(microphoneVolume);

  if (meterStream) {
    meterStream.getTracks().forEach((track) => track.stop());
    meterStream = null;
  }

  if (meterAudioContext) {
    await meterAudioContext.close();
    meterAudioContext = null;
  }

  meterAnalyser = null;
  meterDataArray = null;
};

const ensureMeter = async (microphoneVolume) => {
  if (meterAnalyser && meterStream) {
    stopVolumeLoop(microphoneVolume);
    sampleMicrophoneVolume(microphoneVolume);
    return;
  }

  meterStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  meterAudioContext = new AudioContextCtor();
  const source = meterAudioContext.createMediaStreamSource(meterStream);
  meterAnalyser = meterAudioContext.createAnalyser();
  meterAnalyser.fftSize = 512;
  meterAnalyser.smoothingTimeConstant = 0.82;
  meterDataArray = new Uint8Array(meterAnalyser.fftSize);
  source.connect(meterAnalyser);

  stopVolumeLoop(microphoneVolume);
  sampleMicrophoneVolume(microphoneVolume);
};

// “如果听到用户说话了，该怎么做（onVoiceStart）”
export function useMicrophone(onVoiceStart) {
  // 录音机本体和防抖锁
  const recognizer = ref(null);
  const microphoneVolume = ref(0);
  let isRecognizerInitializing = false;

  // Direct ASR via Cloudflare Worker proxy (skips backend hop for lower latency)
  const recognizeSpeech = async (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");
    const res = await uploadVoice1(formData);
    const payload = res.data;
    return typeof payload === "string" ? payload : payload?.data || payload?.text || "";
  };

  // 向浏览器申请麦克风权限，并同步建立真实音量分析链路
  const initRecognizer = async () => {
    if (isRecognizerInitializing) {
      console.warn("[麦克风防抖] 正在初始化中，拒绝重复调用");
      return;
    }

    isRecognizerInitializing = true;
    try {
      await ensureMeter(microphoneVolume);

      if (recognizer.value) {
        recognizer.value.close();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      recognizer.value = new VoiceRecognizerWithVAD({
        vad: CONFIG.vad,
        onVoiceStart,
      });

      await recognizer.value.init();
    } catch (error) {
      console.error("[麦克风] 初始化彻底失败:", error);
      throw error;
    } finally {
      isRecognizerInitializing = false;
    }
  };

  // 强制关闭并销毁麦克风
  const closeRecognizer = async () => {
    if (recognizer.value) {
      recognizer.value.close();
      recognizer.value = null;
    }
    await releaseMeter(microphoneVolume);
  };

  return {
    recognizer,
    microphoneVolume,
    recognizeSpeech,
    initRecognizer,
    closeRecognizer,
  };
}
