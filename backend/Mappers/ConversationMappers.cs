using AICall.API.Dtos.Conversation;
using AICall.API.Models;

namespace AICall.API.Mappers
{
    public static class ConversationMappers
    {
        public static CallSession ToCallSessionFromDto(this ChatRequestDto requestDto, string generatedSummary, string userId)
        {
            var session = new CallSession
            {
                AppUserId = userId,
                Category = requestDto.Category,
                SubCategory = requestDto.Sub_Category,
                SceneType = requestDto.SceneType,
                Summary = generatedSummary,
                StartTime = DateTime.Now,
                EndTime = DateTime.Now,
                Messages = new List<CallMessage>()
            };
            // 遍历 DTO 中的对话记录，映射为数据库的子表实体
            foreach (var msg in requestDto.Conversation)
            {
                //确认父子关系，自动给session赋id时自动给 message赋sessionId
                session.Messages.Add(new CallMessage
                {
                    Role = msg.Role,
                    Content = msg.Content,
                    Timestamp = DateTime.Now
                });
            }

            return session;
        }
    }
}
