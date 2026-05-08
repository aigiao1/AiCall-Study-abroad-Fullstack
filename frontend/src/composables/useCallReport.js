// src/composables/useCallReport.js
import { ref } from "vue";
import { useRoute } from "vue-router";
import { LLMServer } from "../utils/llm.js";

export function useCallReport() {
  const route = useRoute();
  
  // 各种弹窗的开关和数据
  const showReportModal = ref(false);
  const showEndScreen = ref(false);
  const reportSummary = ref({});
  const isGeneratingReport = ref(false);

  // 关掉总结弹窗
  const closeReportModal = () => {
    showReportModal.value = false;
  };

  const generateConversationReport = async (messagesArray, sceneType) => {
    isGeneratingReport.value = true;
    try {
      const category = route.query.category || "";
      const subCategory = route.query.sub_category || "";
      const result = await LLMServer.generateReport(messagesArray, category, subCategory, sceneType);
      if (result?.data?.report_msg?.summary) {
        reportSummary.value = result.data.report_msg.summary;
      } else {
        reportSummary.value = { Info: "Summary unavailable — the AI service may be temporarily busy." };
      }
    } catch (error) {
      console.error("Report generation failed:", error);
      reportSummary.value = { Info: "Summary unavailable — the AI service may be temporarily busy." };
    } finally {
      isGeneratingReport.value = false;
    }
  };

  // 把东西交接给
  return {
    showReportModal,             // [输出]: 总结弹窗开关（ref<boolean>），true 表示展示 SummaryModal
    showEndScreen,               // [输出]: 结束页开关（ref<boolean>），当前文件里未使用但可作为“结束态 UI”标记
    reportSummary,               // [输出]: 总结报告数据（ref<object>），给 SummaryModal 渲染用
    isGeneratingReport,          // [输出]: 总结生成中（ref<boolean>），用于 loading 状态
    closeReportModal,            // [输入]: 关闭总结弹窗的动作（函数）
    generateConversationReport,  // [输入]: 生成总结报告的动作（async 函数），传入 messages 数组后请求后端并写入 reportSummary
  };
}