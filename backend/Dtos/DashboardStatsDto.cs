namespace AICall.API.Dtos
{
    public class DashboardStatsDto
    {
        public int TotalCalls { get; set; }
        public int WeeklyCalls { get; set; }
        public double TotalDurationSeconds { get; set; }
        public double AvgDurationSeconds { get; set; }
        public List<CategoryStatDto> CategoryDistribution { get; set; } = new();
        public List<DailyTrendDto> WeeklyTrend { get; set; } = new();
        public List<RecentSessionDto> RecentSessions { get; set; } = new();
    }

    public class CategoryStatDto
    {
        public string Category { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class DailyTrendDto
    {
        public string Date { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class RecentSessionDto
    {
        public int Id { get; set; }
        public DateTime? StartTime { get; set; }
        public string? Category { get; set; }
        public string? SubCategory { get; set; }
    }
}
