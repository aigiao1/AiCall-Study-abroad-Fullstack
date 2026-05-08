using AICall.API.Dtos.Conversation;
using AICall.API.Models;

namespace AICall.API.Interfaces
{
    public interface ILLMService
    {
        Task<string> GetChatResponseAsync(List<MessageDto> messages, string category, SceneType sceneType = SceneType.StudyAbroad);

        Task<string> GenerateSummaryAsync(List<MessageDto> messages, string category);

        IAsyncEnumerable<string> GetChatStreamAsync(List<MessageDto> messages, string category, SceneType sceneType = SceneType.StudyAbroad);
    }
}
