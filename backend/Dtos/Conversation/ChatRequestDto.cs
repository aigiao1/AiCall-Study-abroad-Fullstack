using AICall.API.Models;

namespace AICall.API.Dtos.Conversation
{
    public class ChatRequestDto
    {
        public List<MessageDto> Conversation { get; set; } = new();
        public string Category { get; set; } = string.Empty;
        public string Sub_Category { get; set; } = string.Empty;
        public SceneType SceneType { get; set; } = SceneType.StudyAbroad;
    }
}
