// src/composables/useSSEChatStream.js
export function useSSEChatStream() {
    // 遥控器：专门用来强制切断网络请求（比如用户突然打断了 AI）
    let chatStreamController = null;
  
    // 1. 强制掐断请求的方法
    const abortStream = () => {
      if (chatStreamController) {
        chatStreamController.abort();
        chatStreamController = null;
      }
    };
  
    /**
     * 2. 发起流式请求去拿数据
     * @param {Object} requestBody 要发送给后端的数据（
     * @param {Function} onToken 每次接到一个新字
     * @param {Function} onDone 全部接完了
     * @param {Function} onError 报错了
     */
    const fetchChatStream = async (requestBody, onToken, onDone, onError) => {
      // 每次发新请求前，先把旧的掐断，保证不串台
      abortStream();
      chatStreamController = new AbortController();
  
      try {
        const token = localStorage.getItem("userToken") || "";
        const baseURL = import.meta.env.DEV ? "/aicall/api" : "https://123.com.cn";
        const fetchUrl = `${baseURL}/Conversation/chat-stream`;
  
        const response = await fetch(fetchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
          signal: chatStreamController.signal,
        });
  
        if (!response.ok) throw new Error("HTTP 状态异常");
  
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let sseBuffer = "";
        let fullAiText = ""; 
  
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
  
          sseBuffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
          const events = sseBuffer.split("\n\n");
          sseBuffer = events.pop() || "";
  
          for (const eventBlock of events) {
            const dataLines = eventBlock
              .split("\n")
              .filter((line) => line.startsWith("data:"))
              .map((line) => (line.startsWith("data: ") ? line.slice(6) : line.slice(5)));
  
            if (dataLines.length === 0) continue;
            const dataStr = dataLines.join("\n");
  
            if (dataStr === "[DONE]") {
              onDone(fullAiText);
              return;
            } else if (dataStr.startsWith("[ERROR]")) {
              onError(new Error(dataStr));
              break;
            } else {
              // 接到了新字！
              fullAiText += dataStr;
              onToken(dataStr, fullAiText);
            }
          }
        }
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("[网络经理] 用户打断了 AI，网络请求已静默终止");
        } else {
          onError(error);
        }
      } finally {
        chatStreamController = null;
      }
    };
  
    return {
      fetchChatStream, // [输入]: 发起流式对话请求（async 函数），回调 onToken/onDone/onError 进行增量/完成/报错处理
      abortStream,     // [输入]: 强制中断在途请求（函数），用于用户打断/切换流程时避免“串台”
    };
  }