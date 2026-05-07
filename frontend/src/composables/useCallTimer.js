// src/composables/useCallTimer.js
import { ref } from 'vue'

export function useCallTimer() {
  // 部门私有变量（记事本）
  const callStartTime = ref(null)
  const callTimerInterval = ref(null)
  
  // 对外展示的表盘
  const callTimer = ref("00:00")

  // 开始计时的开关
  const startCallTimer = () => {
    callStartTime.value = Date.now()
    callTimer.value = "00:00"
    
    // 每隔 1000 毫秒（1秒）算一次时间
    callTimerInterval.value = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime.value) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      callTimer.value = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }, 1000)
  }

  // 停止计时的开关
  const stopCallTimer = () => {
    if (callTimerInterval.value) {
      clearInterval(callTimerInterval.value)
      callTimerInterval.value = null
    }
  }

  // 把表盘和开关交出去
  return {
    callTimer,        // [输出]: 计时器展示值（ref），形如 "01:35"
    startCallTimer,   // [输入]: 开始计时的开关（函数），调用后每秒更新 callTimer
    stopCallTimer     // [输入]: 停止计时的开关（函数），调用后清理 interval 防止泄漏
  }
}