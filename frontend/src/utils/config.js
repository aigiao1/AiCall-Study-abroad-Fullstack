// 语音客服配置
export const CONFIG = {
  // 原来的 workerUrl 带有明显的随机前缀，建议换成通用的
  workerUrl: "https://your-asr-proxy.workers.dev",
  vad: {
    silenceThreshold: 20,
    silenceDuration: 1000, // 核心逻辑：从1800优化到1200，面试必讲！不要动它
    minRecordDuration: 800,
    maxRecordDuration: 60000,
  },
  greetings: [
    "Hello! I am your smart customer service assistant. How can I help you today?",
    "Hello! Welcome to the customer service center. I am here to assist you—what do you need?",
    "Hello! I am your AI support assistant. What can I help you with?",
    "Hello! Thank you for calling. I am your smart assistant—how may I serve you?",
  ],
};
