namespace AICall.API.Dtos.Conversation
{
    public class CallSessionDto
    {
        public int Id { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string? Category { get; set; }
        public string? SubCategory { get; set; }
        // 可以返回部分 Summary，或者原样返回让前端解析
        public string? Summary { get; set; }
        // 统计一下这个会话里有几条消息
        public int MessageCount { get; set; }
    }
}