// src/utils/audioManager.js

const silentAudioBase64 =
  "UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

function createSilentBlobUrl() {
  const byteCharacters = atob(silentAudioBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

class AudioManager {
  constructor() {
    if (!AudioManager.instance) {
      this.audio = new Audio();
      this.isUnlocked = false;
      this.silentBlobUrl = createSilentBlobUrl();
      AudioManager.instance = this;
    }
    return AudioManager.instance;
  }

  unlock() {
    if (this.isUnlocked) return;
    this.audio.src = this.silentBlobUrl;
    this.audio.load();
    this.audio
      .play()
      .then(() => {
        this.isUnlocked = true;
        console.log("[Audio] 播放权限已通过 Blob 协议解锁");
      })
      .catch((err) => {
        console.warn("[Audio] 权限解锁异常:", err);
      });
  }

  getAudio() {
    return this.audio;
  }
}

export const globalAudioManager = new AudioManager();
