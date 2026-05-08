/**
 * LLM 服务模块
 * 处理与 AI 对话相关的逻辑
 */
import { apiLlmChat, apiGenerateReport } from '../api/index.js';

export const LLMServer = {
  conversationRounds: 0,

  async chat(messages, category, subCategory, sceneType = 1) {
    const result = await apiLlmChat({
      conversation: messages.map(x => ({ role: x.role, content: x.content })),
      category,
      sub_category: subCategory,
      sceneType,
    });

    this.conversationRounds++
		console.log("request llm with response", result)
    
    return {
      role: 'salesman',
      content: result.data.response_msg.answer,
      shouldEnd: result.data.response_msg.is_end || false
    }
  },

  reset() {
    this.conversationRounds = 0
  },

  async generateReport(messages, category, subCategory, sceneType = 1) {

    try{
      const result = await apiGenerateReport({
      conversation: messages.map(x => ({ role: x.role, content: x.content })),
      category,
      sub_category: subCategory,
      sceneType,
    });
    console.log("generate report with response", result);
    return result;
  } catch (error) {
    console.error("生成报告失败:", error)
    return null
  }
  }
}
