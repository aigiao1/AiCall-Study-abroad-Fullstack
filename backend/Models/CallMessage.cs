namespace AICall.API.Models
{
    public class CallMessage
    {
        public int Id { get; set; }
        public int CallSessionId { get; set; }//外键
        public CallSession CallSession { get; set; }//导航属性儿子知道爸爸是谁
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
