using AICall.API.Dtos.Conversation;

namespace AICall.API.Interfaces
{
    public interface ILLMService
    {   // 传入前端给的对话列表和分类，返回大模型的纯文本回复
        Task<string> GetChatResponseAsync(List<MessageDto> messages, string category);

        // 传入完整的对话列表，返回大模型生成的总结报告的原始 JSON 字符串
        Task<string> GenerateSummaryAsync(List<MessageDto> messages, string category);

        // 新增的流式方法：注意返回值是 IAsyncEnumerable<string>
        IAsyncEnumerable<string> GetChatStreamAsync(List<MessageDto> messages, string category);
    }
}
