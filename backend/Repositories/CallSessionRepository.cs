using AICall.API.Data;
using AICall.API.Dtos;
using AICall.API.Dtos.Conversation;
using AICall.API.Interfaces;
using AICall.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace AICall.API.Repositories
{
    public class CallSessionRepository : ICallSessionRepository
    {
        private readonly ApplicationDBContext _context;
        public CallSessionRepository(ApplicationDBContext context)
        {
            _context = context;
        }
        public async Task<CallSession> CreateSessionAsync(CallSession session)
        {
            await _context.CallSessions.AddAsync(session);
            await _context.SaveChangesAsync();

            return session;
        }


        // 获取会话列表 (支持分页和筛选)
        public async Task<PagedResult<CallSessionDto>> GetSessionsAsync(CallSessionQueryObject query, string userId)
        {
            // 1. 构建基础查询，严格限制只能查当前用户的数据
            var sessionsAsQueryable = _context.CallSessions
                .Where(s => s.AppUserId == userId)
                .AsQueryable();
            // 2. 动态条件过滤：如果前端传了分类，就加上这个过滤条件
            if (!string.IsNullOrWhiteSpace(query.Category))
            {
                sessionsAsQueryable = sessionsAsQueryable.Where(s => s.Category == query.Category);
            }
            // 3. 计算符合条件的总条数 (必须在分页 Skip 和 Take 之前执行)
            var totalCount = await sessionsAsQueryable.CountAsync();
            // 4. 分页、排序并投影 (这是性能最核心的一步！)
            var items = await sessionsAsQueryable.OrderByDescending(s => s.StartTime) // 按开始时间倒序
                .Skip((query.PageNumber - 1) * query.PageSize) // 跳过前面页的数据
                .Take(query.PageSize) // 取当前页的数据
                .Select(s => new CallSessionDto // 投影成 DTO
                {
                    Id = s.Id,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    Category = s.Category,
                    SubCategory = s.SubCategory,
                    Summary = s.Summary,
                    MessageCount = s.Messages != null ? s.Messages.Count : 0
                })
                .ToListAsync();
            return new PagedResult<CallSessionDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize
            };
        }

        //查看某会话
        public async Task<CallSession> GetSessionByIdAsync(int id, string userId)
        {
            // 详情页我们需要看到聊天记录，所以这里使用 Include 把关联的 Messages 一起带出来
            return await _context.CallSessions
                .Include(s => s.Messages)
                .FirstOrDefaultAsync(s => s.Id == id && s.AppUserId == userId);
        }

        // 删除会话
        public async Task<bool> DeleteSessionAsync(int id, string userId)
        {
            // 同时加载 Messages，确保只能删除属于当前用户的会话
            var session = await _context.CallSessions
                .Include(s => s.Messages)
                .FirstOrDefaultAsync(s => s.Id == id && s.AppUserId == userId);

            if (session == null) return false;

            // EF Core 已配置级联删除，可以直接 Remove(session)
            _context.CallSessions.Remove(session);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync(string userId)
        {
            var userSessions = _context.CallSessions.Where(s => s.AppUserId == userId);

            var now = DateTime.UtcNow;
            var weekStart = now.Date.AddDays(-(int)now.DayOfWeek);

            var totalCalls = await userSessions.CountAsync();
            var weeklyCalls = await userSessions.CountAsync(s => s.StartTime >= weekStart);

            var durations = await userSessions
                .Where(s => s.EndTime != null)
                .Select(s => (s.EndTime!.Value - s.StartTime!.Value).TotalSeconds)
                .ToListAsync();
            var totalDurationSeconds = durations.Sum();
            var avgDurationSeconds = durations.Count > 0 ? Math.Round(durations.Average(), 1) : 0;

            var categoryDist = await userSessions
                .GroupBy(s => s.Category ?? "Uncategorized")
                .Select(g => new CategoryStatDto { Category = g.Key, Count = g.Count() })
                .ToListAsync();

            var sevenDaysAgo = now.Date.AddDays(-6);
            var rawTrend = await userSessions
                .Where(s => s.StartTime >= sevenDaysAgo)
                .GroupBy(s => s.StartTime!.Value.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var weeklyTrend = Enumerable.Range(0, 7)
                .Select(offset => sevenDaysAgo.AddDays(offset))
                .GroupJoin(rawTrend, d => d.Date, r => r.Date, (d, rs) => new DailyTrendDto
                {
                    Date = d.ToString("MM-dd"),
                    Count = rs.FirstOrDefault()?.Count ?? 0
                })
                .ToList();

            var recentSessions = await userSessions
                .OrderByDescending(s => s.StartTime)
                .Take(5)
                .Select(s => new RecentSessionDto
                {
                    Id = s.Id,
                    StartTime = s.StartTime,
                    Category = s.Category,
                    SubCategory = s.SubCategory
                })
                .ToListAsync();

            return new DashboardStatsDto
            {
                TotalCalls = totalCalls,
                WeeklyCalls = weeklyCalls,
                TotalDurationSeconds = totalDurationSeconds,
                AvgDurationSeconds = avgDurationSeconds,
                CategoryDistribution = categoryDist,
                WeeklyTrend = weeklyTrend,
                RecentSessions = recentSessions
            };
        }
    }
}
