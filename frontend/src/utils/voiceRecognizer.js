import { CONFIG } from "./config.js";
import Recorder from "recorder-core";
import "recorder-core/src/engine/wav";

// 调试开关，生产环境可设为 false
const VAD_DEBUG = true;
const log = (...args) => VAD_DEBUG && console.log("[VAD]", ...args);

/**
 * 检测是否为华为设备或华为浏览器
 * @returns {{ isHuaweiDevice: boolean, isHuaweiBrowser: boolean, isHuawei: boolean }}
 */
export function detectHuawei() {
  const ua = navigator.userAgent || "";
  
  // 华为手机检测：HUAWEI、HONOR（荣耀）、HarmonyOS（鸿蒙系统）
  const isHuaweiDevice = /HUAWEI|HONOR|HarmonyOS/i.test(ua);
  
  // 华为浏览器检测：HuaweiBrowser、HBPC（华为PC浏览器）
  const isHuaweiBrowser = /HuaweiBrowser|HBPC/i.test(ua);
  
  return {
    isHuaweiDevice,    // 是否为华为手机
    isHuaweiBrowser,   // 是否为华为浏览器
    isHuawei: isHuaweiDevice || isHuaweiBrowser// 任一为真
  };
}

export class VoiceRecognizerWithVAD {
  constructor(options = {}) {
    this.recorder = null;
    this.isRecording = false;
    this.vadConfig = { ...CONFIG.vad, ...options.vad };
    this.recorderConfig = {
      type: "wav",
      sampleRate: 16000,
      bitRate: 16,
      ...options.recorder,
    };
    this.lastVoiceTime = 0;
    this.recordStartTime = 0;
    this.onAutoStop = null;
    this.onVoiceStart = options.onVoiceStart || null;
    this.silenceStartTime = null;
    // 打断检测模式
    this.bargeInMode = options.bargeInMode || false;
    this.onBargeIn = options.onBargeIn || null;
    this.bargeInDetected = false;
    
    log("初始化配置:", {
      silenceThreshold: this.vadConfig.silenceThreshold,
      silenceDuration: this.vadConfig.silenceDuration,
      minRecordDuration: this.vadConfig.minRecordDuration,
      maxRecordDuration: this.vadConfig.maxRecordDuration,
    });
  }

  async init() {
    log("开始初始化录音器...");
    this.recorder = new Recorder({
      type: this.recorderConfig.type,
      sampleRate: this.recorderConfig.sampleRate,
      bitRate: this.recorderConfig.bitRate,
      audioTrackSet: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      onProcess: (buffers, powerLevel, duration, sampleRate, newBufferIdx) =>
        this.handleVAD(buffers, powerLevel, duration, newBufferIdx),
    });
    return new Promise((resolve, reject) => {
      this.recorder.open(
        () => {
          log("录音器初始化成功，麦克风已打开");
          resolve();
        },
        (msg, isNotAllow) => {
          const error = new Error(isNotAllow ? "用户拒绝录音权限" : msg);
          error.isPermissionDenied = isNotAllow;
          log("录音器初始化失败:", msg, "权限被拒:", isNotAllow);
          reject(error);
        },
      );
    });
  }
  setBargeInMode(enabled, onBargeIn) {
    this.bargeInMode = enabled;
    this.onBargeIn = onBargeIn || null;
    this.bargeInDetected = false;
    log("打断检测模式:", enabled ? "开启" : "关闭");
  }
  handleVAD(buffers, powerLevel, duration, newBufferIdx) {
    if (!this.isRecording) return;
    const now = Date.now();
    const isVoice = powerLevel > this.vadConfig.silenceThreshold;
    const recordDuration = now - this.recordStartTime;

    // 每500ms输出一次状态日志，避免日志过多
    if (!this._lastLogTime || now - this._lastLogTime > 500) {
      this._lastLogTime = now;
      log(
        `状态: 音量=${powerLevel.toFixed(1)} | 阈值=${this.vadConfig.silenceThreshold} | ` +
        `是声音=${isVoice} | 已开口=${this.hasVoiceStarted} | ` +
        `连续帧=${this.voiceFrameCount || 0} | 录制时长=${recordDuration}ms | ` +
        `缓冲帧数=${buffers.length}`
      );
    }

    if (isVoice) {
      this.voiceFrameCount = (this.voiceFrameCount || 0) + 1;
      if (this.voiceFrameCount >= 2) {
        this.lastVoiceTime = now;
        this.silenceStartTime = null;
        if (this.onVoiceStart && !this.hasVoiceStarted) {
          this.hasVoiceStarted = true;
          log("✅ 检测到用户开始说话! 音量:", powerLevel.toFixed(1));
          this.onVoiceStart();
        }
        // 打断检测模式：检测到声音即触发打断
        if (this.bargeInMode && !this.bargeInDetected && this.onBargeIn) {
          this.bargeInDetected = true;
          log("⚡ 触发打断! 音量:", powerLevel.toFixed(1));
          this.onBargeIn();
        }
      }
    } else {
      this.voiceFrameCount = 0;
      if (!this.silenceStartTime) {
        this.silenceStartTime = now;
      }
    }

    //静音覆写
    if (!this.hasVoiceStarted) {
      const preRollFrames = 5;
      const muteEndIdx = buffers.length - preRollFrames;

      // 仅对确认无效的历史块进行覆写，避免重复遍历浪费性能
      const startIdx = this.lastMutedIdx || 0;
      const mutedCount = Math.max(0, muteEndIdx - startIdx);
      if (mutedCount > 0 && !this._lastMuteLogTime || now - this._lastMuteLogTime > 1000) {
        this._lastMuteLogTime = now;
        log(`静音覆写: 从帧${startIdx}到帧${muteEndIdx}, 共${mutedCount}帧`);
      }
      for (let i = startIdx; i < muteEndIdx; i++) {
        if (buffers[i]) {
          buffers[i].fill(0);
        }
      }
      // 更新指针，下次从这里开始抹除
      this.lastMutedIdx = Math.max(0, muteEndIdx);
    }

    const silenceTime = now - this.lastVoiceTime;

    if (
      this.hasVoiceStarted &&
      recordDuration > this.vadConfig.minRecordDuration &&
      silenceTime > this.vadConfig.silenceDuration
    ) {
      log(`🛑 静音超时停止: 静音时长=${silenceTime}ms, 阈值=${this.vadConfig.silenceDuration}ms`);
      this.stopWithCallback("silence");
    } else if (recordDuration >= this.vadConfig.maxRecordDuration) {
      log(`🛑 最大时长停止: 录制时长=${recordDuration}ms`);
      this.stopWithCallback("maxDuration");
    } else if (!this.hasVoiceStarted && recordDuration > 8000) {
      log(`🛑 无人说话停止: 8秒内未检测到声音`);
      this.stopWithCallback("noVoice");
    }
  }

  start(onAutoStop) {
    if (!this.recorder) throw new Error("录音器未初始化");
    this.onAutoStop = onAutoStop;
    this.recordStartTime = Date.now();
    this.lastVoiceTime = Date.now();
    this.silenceStartTime = null;
    this.hasVoiceStarted = false;
    this.voiceFrameCount = 0;
    this.bargeInDetected = false;
    this.lastMutedIdx = 0;
    this._lastLogTime = null;
    this._lastMuteLogTime = null;
    this.recorder.start();
    this.isRecording = true;
    log("▶️ 开始录音");
  }

  stopWithCallback(reason) {
    if (!this.isRecording) return;
    log(`⏹️ 停止录音, 原因: ${reason}`);
    this.stop()
      .then((result) => {
        log(`录音结果: 大小=${(result.blob.size / 1024).toFixed(2)}KB, 时长=${result.duration}ms`);
        if (this.onAutoStop) this.onAutoStop({ ...result, reason });
      })
      .catch((error) => console.error("[VAD] 停止录音失败:", error));
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (!this.recorder) {
        reject(new Error("录音器未初始化"));
        return;
      }
      this.isRecording = false;
      this.recorder.stop(
        (blob, duration) => resolve({ blob, duration }),
        (msg) => reject(new Error(msg)),
      );
    });
  }

  close() {
    if (this.recorder) {
      log("关闭录音器");
      this.recorder.close();
      this.recorder = null;
      this.isRecording = false;
    }
  }

  static isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}
