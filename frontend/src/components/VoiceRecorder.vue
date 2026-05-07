<template>
  <div class="voice-recorder">
    <!-- 录音按钮容器 -->
    <div class="recorder-container">
      <!-- 录音按钮 - 根据状态显示不同样式 -->
      <button
        class="record-btn"
        :class="{ recording: isRecording, loading: isInitializing }"
        @click="toggleRecording"
        :disabled="isInitializing || isUploading"
      >
        <!-- 不同状态显示不同图标 -->
        <span class="btn-icon">
          <svg v-if="isInitializing" class="icon-spin" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="3"
              fill="none"
              stroke-dasharray="30 30"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 12 12"
                to="360 12 12"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          <svg v-else-if="isRecording" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="8" />
          </svg>
        </span>
        <span class="btn-text">{{ buttonText }}</span>
      </button>

      <!-- 录音时长显示 -->
      <div v-if="isRecording || currentDuration > 0" class="duration-display">
        {{ formatDuration(currentDuration) }}
      </div>
    </div>
    <!-- <audio ref="audioPlayer" controls>
      <source ref="audioSource" type="audio/wav" :src="audioUrl" />
      <source :src="audioUrl" type="audio/mpeg">
      <source :src="audioUrl" type="audio/ogg">
      Your browser does not support this audio format.
    </audio> -->
    <!-- 音量可视化条 -->
    <!-- <div v-if="isRecording && showVolumeBar" class="volume-indicator">
      <div
        class="volume-bar"
        :style="{
          width: volumeLevel + '%',
          backgroundColor: getVolumeColor(volumeLevel),
        }"
      ></div>
    </div> -->

    <!-- 录音状态提示 -->
    <!-- <div v-if="statusMessage" class="status-message" :class="statusType">
      {{ statusMessage }}
    </div> -->

    <!-- 已识别文字显示 -->
    <!-- <div v-if="recognitionText" class="recognition-result">
      <div class="result-label">识别结果：</div>
      <div class="result-text">{{ recognitionText }}</div>
    </div> -->
  </div>
</template>

<script>
import { uploadVoice, uploadVoice1 } from "@/api";
import Recorder from "recorder-core";
import "recorder-core/src/engine/wav";
import "recorder-core/src/extensions/waveview";

// VAD参数配置
const VAD_CONFIG = {
  silenceThreshold: 5, // 静音阈值，可根据环境调整
  silenceDuration: 1500, // 静音持续时间(ms)
  minRecordDuration: 800, // 最小录音时长(ms)
  maxRecordDuration: 60000, // 最大录音时长(ms)
};

// Worker URL - 请替换为您的实际Worker地址
const WORKER_URL = "https://asr-proxy.your-subdomain.workers.dev";

export default {
  name: "VoiceRecorder",

  props: {
    // 是否显示音量条
    showVolumeBar: {
      type: Boolean,
      default: true,
    },
    // 自动开始录音
    autoStart: {
      type: Boolean,
      default: false,
    },
    // VAD配置，可覆盖默认值
    vadConfig: {
      type: Object,
      default: () => ({}),
    },
    // 识别成功后是否自动清空
    autoClearAfterSuccess: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      // 录音器实例
      recorder: null,
      waveView: null,

      // 状态标志
      isInitializing: false,
      isRecording: false,
      isUploading: false,
      audioUrl: "",
      // 录音相关数据
      audioBlob: null,
      currentDuration: 0,
      volumeLevel: 0,

      // VAD状态
      lastVoiceTime: 0,
      recordStartTime: 0,
      vadTimer: null,

      // 状态消息
      statusMessage: "",
      statusType: "info", // info, success, error

      // 识别结果
      recognitionText: "",

      // 权限状态
      permissionGranted: false,
      permissionError: null,
    };
  },

  computed: {
    // 按钮文本
    buttonText() {
      if (this.isInitializing) return "初始化中...";
      if (this.isUploading) return "上传中...";
      if (this.isRecording) return "停止录音";
      return "开始录音";
    },

    // 格式化后的按钮文本
    formattedButtonText() {
      return this.buttonText;
    },
  },

  watch: {
    autoStart: {
      immediate: true,
      handler(val) {
        if (val && !this.isRecording && !this.isInitializing) {
          this.$nextTick(() => {
            this.startRecording();
          });
        }
      },
    },
  },

  mounted() {
    // 组件挂载时检查浏览器兼容性
    this.checkBrowserSupport();
  },

  beforeDestroy() {
    // 组件销毁前清理资源
    this.cleanup();
  },

  methods: {
    // 检查浏览器支持
    checkBrowserSupport() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.showStatus(
          "您的浏览器不支持录音功能，请使用Chrome、Firefox或Edge浏览器",
          "error",
        );
      }
    },

    // 初始化录音器
    async initRecorder() {
      if (this.recorder) return;

      this.isInitializing = true;
      this.showStatus("正在请求麦克风权限...", "info");

      try {
        // 合并VAD配置
        const finalVadConfig = { ...VAD_CONFIG, ...this.vadConfig };

        // 创建录音实例
        this.recorder = new Recorder({
          type: "wav",
          sampleRate: 16000,
          bitRate: 16,
          onProcess: (buffers, powerLevel, duration) => {
            // 更新时长和音量
            this.currentDuration = duration;
            this.volumeLevel = Math.min(100, Math.floor(powerLevel * 1.5));

            // VAD静音检测
            this.handleVAD(powerLevel, duration, finalVadConfig);
          },
        });

        // 打开麦克风
        await new Promise((resolve, reject) => {
          this.recorder.open(
            () => {
              this.permissionGranted = true;
              this.showStatus("麦克风已就绪", "success");
              resolve();
            },
            (msg, isNotAllow) => {
              const errorMsg = isNotAllow ? "您拒绝了麦克风权限" : msg;
              this.permissionError = errorMsg;
              this.showStatus(errorMsg, "error");
              reject(new Error(errorMsg));
            },
          );
        });

        // 初始化波形视图（可选）
        if (this.showVolumeBar) {
          this.initWaveView();
        }
      } catch (error) {
        console.error("初始化录音失败:", error);
        this.showStatus(error.message || "初始化录音失败", "error");
        throw error;
      } finally {
        this.isInitializing = false;
      }
    },

    // 初始化波形视图
    initWaveView() {
      // 如果需要在canvas上显示波形，可以在这里实现
      // 这里简化处理，使用音量条代替
    },

    // VAD静音检测处理
    handleVAD(powerLevel, duration, config) {
      const now = Date.now();

      // 检测到声音（音量超过阈值）
      console.log(
        "检测到声音---powerLevel",
        powerLevel,
        config.silenceThreshold,
      );
      if (powerLevel > config.silenceThreshold) {
        this.lastVoiceTime = now;
      }

      // 检查静音时长
      const silenceTime = now - this.lastVoiceTime;
      const recordDuration = now - this.recordStartTime;

      // 检查最大录音时长
      if (recordDuration > config.maxRecordDuration) {
        this.showStatus(
          `录音时长已达${Math.floor(config.maxRecordDuration / 1000)}秒限制`,
          "info",
        );
        this.stopRecording(true);
        return;
      }

      // 满足条件：录音时间超过最小时长 && 静音时间超过阈值

      if (
        recordDuration > config.minRecordDuration &&
        silenceTime > config.silenceDuration
      ) {
        console.log(`静音 ${silenceTime}ms，${recordDuration}ms自动停止录音`);
        // this.showStatus('检测到静音，自动停止', 'info')
        this.stopRecording(true);
      }
    },

    // 切换录音状态
    async toggleRecording() {
      if (this.isRecording) {
        await this.stopRecording();
      } else {
        await this.startRecording();
      }
    },

    // 开始录音
    async startRecording() {
      if (this.isRecording || this.isUploading) return;

      try {
        // 初始化录音器（如果未初始化）
        if (!this.recorder) {
          await this.initRecorder();
        }

        // 重置状态
        this.audioBlob = null;
        this.recognitionText = "";
        this.currentDuration = 0;
        this.volumeLevel = 0;

        // 记录开始时间
        this.recordStartTime = Date.now();
        this.lastVoiceTime = Date.now();

        // 开始录音
        this.recorder.start();
        this.isRecording = true;
        this.showStatus("录音中...", "info");

        // 触发开始事件
        this.$emit("recording-started");
      } catch (error) {
        console.error("开始录音失败:", error);
        this.showStatus(error.message || "开始录音失败", "error");
      }
    },

    // 停止录音
    async stopRecording(isAutoStop = false) {
      if (!this.isRecording || !this.recorder) return;

      return new Promise((resolve) => {
        this.recorder.stop(
          async (blob, duration) => {
            this.audioBlob = blob;
            this.currentDuration = duration;
            this.isRecording = false;

            // this.showStatus('录音完成，正在识别...', 'info')

            // 触发停止事件
            // this.$emit('recording-stopped', { blob, duration, isAutoStop })
            // if (this.audioUrl) {
            //   URL.revokeObjectURL(this.audioUrl);
            // }
            this.audioUrl = URL.createObjectURL(blob);
            console.log('this.audioUrl--->', this.audioUrl)
            // 自动上传识别
            await this.uploadAndRecognize();

            resolve();
          },
          (msg) => {
            this.showStatus(`停止录音失败: ${msg}`, "error");
            this.isRecording = false;
            resolve();
          },
        );
      });
    },

    // 上传并识别
    async uploadAndRecognize() {
      if (!this.audioBlob) {
        this.showStatus("没有可识别的音频", "error");
        return;
      }

      this.isUploading = true;

      try {
        const formData = new FormData();
        const audioFile = new File([this.audioBlob], "recording.wav", {
          type: "audio/wav",
        });
        formData.append("file", audioFile);

        const response = await uploadVoice(formData);
        console.log("response----->6666", response);
   
      } catch (error) {
        console.error("识别失败:", error);
        this.showStatus(error.message || "识别失败", "error");
        this.$emit("recognition-error", error);
      } finally {
        this.isUploading = false;
      }
    },

    // 取消录音（放弃当前录音）
    cancelRecording() {
      if (this.recorder && this.isRecording) {
        this.recorder.stop(
          () => {
            this.isRecording = false;
            this.audioBlob = null;
            this.currentDuration = 0;
            this.showStatus("已取消录音", "info");
            this.$emit("recording-cancelled");
          },
          () => {},
        );
      }
    },

    // 清空录音和结果
    clearRecording() {
      this.audioBlob = null;
      this.recognitionText = "";
      this.currentDuration = 0;
      this.volumeLevel = 0;
    },

    // 格式化时长 (mm:ss.ms)
    formatDuration(duration) {
      if (!duration) return "00:00";
      const seconds = Math.floor(duration / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    },

    // 根据音量获取颜色
    getVolumeColor(level) {
      if (level < 20) return "#4CAF50"; // 绿色
      if (level < 50) return "#FFC107"; // 黄色
      return "#F44336"; // 红色
    },

    // 显示状态消息
    showStatus(message, type = "info") {
      this.statusMessage = message;
      this.statusType = type;

      // 3秒后自动清除非错误消息
      if (type !== "error") {
        setTimeout(() => {
          if (this.statusMessage === message) {
            this.statusMessage = "";
          }
        }, 3000);
      }
    },

    // 清理资源
    cleanup() {
      if (this.vadTimer) {
        clearInterval(this.vadTimer);
        this.vadTimer = null;
      }

      if (this.recorder) {
        try {
          this.recorder.close();
        } catch (e) {
          console.error("关闭录音器失败:", e);
        }
        this.recorder = null;
      }
    },

    // 重试（重新请求权限）
    async retry() {
      this.permissionError = null;
      this.cleanup();
      await this.initRecorder();
    },
  },
};
</script>

<style scoped>
.voice-recorder {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    sans-serif;
  max-width: 400px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recorder-container {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.record-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  background: #4caf50;
  color: white;
}

.record-btn:hover:not(:disabled) {
  transform: scale(1.05);
  background: #45a049;
}

.record-btn.recording {
  background: #f44336;
  animation: pulse 1.5s infinite;
}

.record-btn.recording:hover {
  background: #d32f2f;
}

.record-btn.loading {
  background: #9e9e9e;
  cursor: wait;
}

.record-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.duration-display {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  font-family: monospace;
  min-width: 70px;
}

.volume-indicator {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  margin: 16px 0;
  overflow: hidden;
}

.volume-bar {
  height: 100%;
  transition:
    width 0.1s ease,
    background-color 0.3s ease;
  border-radius: 4px;
}

.status-message {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin: 12px 0;
  animation: slideIn 0.3s ease;
}

.status-message.info {
  background: #e3f2fd;
  color: #1976d2;
}

.status-message.success {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-message.error {
  background: #ffebee;
  color: #c62828;
}

.recognition-result {
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #4caf50;
}

.result-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.result-text {
  font-size: 16px;
  color: #333;
  line-height: 1.5;
  word-break: break-word;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .voice-recorder {
    background: #333;
  }

  .duration-display {
    color: #fff;
  }

  .recognition-result {
    background: #424242;
  }

  .result-label {
    color: #aaa;
  }

  .result-text {
    color: #fff;
  }

  .volume-indicator {
    background: #555;
  }
}
</style>
