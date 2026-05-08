export function useTypingEffect() {
    let typingTimer = null;
  let typingRafId = null;
  const stopTyping = () => {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
    if (typingRafId) {
      cancelAnimationFrame(typingRafId);
      typingRafId = null;
    }
  };
  /**
   * 开始打字
   * @param {String} fullText 完整要打的文字
   * @param {HTMLAudioElement} audioEl 音频对象（用来同步进度）
   * @param {Function} onUpdateText 每次截取到新文字后，叫页面去更新的回调函数
   */
  const startTyping = (fullText, audioEl, onUpdateText) => {
    stopTyping();
    if (!fullText) return;

    // 先清空当前文字
    onUpdateText("");

    // --- 有音频的情况：按音频进度同步 ---
    if (audioEl) {
      const tick = () => {
        if (!audioEl || audioEl.ended) {
          onUpdateText(fullText);
          stopTyping();
          return;
        }
        const duration = audioEl.duration;
        if (Number.isFinite(duration) && duration > 0) {
          const progress = Math.min(1, Math.max(0, audioEl.currentTime / duration));
          const length = Math.max(
            0,
            Math.min(fullText.length, Math.floor(progress * fullText.length))
          );
          // 把算好的文字交还给页面
          onUpdateText(fullText.slice(0, length));
        }
        typingRafId = requestAnimationFrame(tick);
      };
      typingRafId = requestAnimationFrame(tick);
      return;
    }

    // --- 无音频的兜底情况：定时器逐字 ---
    let index = 0;
    typingTimer = setInterval(() => {
      if (index >= fullText.length) {
        stopTyping();
        return;
      }
      index += 1;
      onUpdateText(fullText.slice(0, index));
    }, 60);
  };

  // 把店长需要的方法交出去
  return {
    startTyping, // [输入]: 开始打字机效果（函数），支持“按音频进度同步”或“无音频逐字兜底”
    stopTyping,  // [输入]: 停止打字机效果（函数），清理 interval/raf，防止残留更新
  };
}