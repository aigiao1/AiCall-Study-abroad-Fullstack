// src/composables/useChatMessages.js
import { ref, nextTick } from "vue";

export function useChatMessages() {
  const messages = ref([]);
  const messagesRef = ref(null);

  let messageIdSeq = 0;
  let scrollPending = false;

  const scrollToBottom = () => {
    if (scrollPending) return;
    scrollPending = true;
    // Double-RAF ensures browser has completed layout after Vue DOM update
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollPending = false;
        if (messagesRef.value) {
          messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
        }
      });
    });
  };

  const addMessage = (role, content) => {
    messageIdSeq += 1;
    const message = {
      id: `${Date.now()}-${messageIdSeq}`,
      role,
      content,
      timestamp: Date.now(),
    };
    messages.value.push(message);
    nextTick(() => scrollToBottom());
    return message.id;
  };

  const updateMessageContent = (id, newContent) => {
    const msg = messages.value.find((m) => m.id === id);
    if (msg) {
      msg.content = newContent;
      scrollToBottom();
    }
  };

  return {
    messages,
    messagesRef,
    addMessage,
    updateMessageContent,
  };
}