// src/composables/useChatMessages.js
import { ref, nextTick } from "vue";

export function useChatMessages() {
  const messages = ref([]);
  const messagesRef = ref(null);
  
  let messageIdSeq = 0;

  const scrollToBottom = async () => {
    await nextTick();
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  };

  const addMessage = (role, content) => {
    messageIdSeq += 1;
    const newId = `${Date.now()}-${messageIdSeq}`;
    const message = {
      id: newId,
      role,
      content,
      timestamp: Date.now(),
    };
    messages.value.push(message);
    scrollToBottom();
    return newId; 
  };

  // 修改某一条消息的文字（打字机特效专用）
  const updateMessageContent = (id, newContent) => {
    const msg = [...messages.value].reverse().find((m) => m.id === id);
    if (msg) {
      msg.content = newContent;
      scrollToBottom();
    }
  };

  // 把账本和绝技全部交接出去
  return {
    messages,              // [输出]: 消息列表（ref<array>），每条含 { id, role, content, timestamp }
    messagesRef,           // [输出]: 消息容器 DOM 引用（ref<HTMLElement|null>），用于自动滚动到底部
    addMessage,            // [输入]: 追加一条消息（函数），返回新消息 id（用于后续打字机更新）
    updateMessageContent,  // [输入]: 更新指定消息内容（函数），打字机/同步展示用
  };
}