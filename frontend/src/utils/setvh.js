// utils/setVh.js

let rafId = null

function setVh() {
  const h = window.visualViewport ? window.visualViewport.height : window.innerHeight
  document.documentElement.style.setProperty('--vh', h * 0.01 + 'px')
}

function throttled() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    setVh()
    rafId = null
  })
}

export function initVhListener() {
  // 初始化
  setVh()

  // 如果支持 visualViewport —— 优先使用（对软键盘更准）
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', throttled)
    window.visualViewport.addEventListener('scroll', throttled) // 软键盘弹出常伴随 scroll
  } else {
    // 普通回退
    window.addEventListener('resize', throttled)
  }
}

export function removeVhListener() {
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', throttled)
    window.visualViewport.removeEventListener('scroll', throttled)
  } else {
    window.removeEventListener('resize', throttled)
  }
}
