namespace AICall.API.Models
{
    public class CallSession
    {
        public int Id { get; set; }
        public string? AppUserId { get; set; }//自动生成一个外键，指向 AspNetUsers 表的 Id。
        public AppUser AppUser { get; set; } // 导航属性
        public DateTime? StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; } // 通话结束时间
        public string? Category { get; set; } = string.Empty;
        public string? SubCategory { get; set; } = string.Empty;
        public string? Summary { get; set; } = string.Empty;
        public SceneType SceneType { get; set; } = SceneType.StudyAbroad;
        public List<CallMessage>? Messages { get; set; } = new List<CallMessage>();//One-To-Many爸爸知道儿子们是谁
    }
}
