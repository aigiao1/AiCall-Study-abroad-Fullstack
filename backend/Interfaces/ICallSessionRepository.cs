using AICall.API.Dtos;
using AICall.API.Dtos.Conversation;
using AICall.API.Models;

namespace AICall.API.Interfaces
{

    public interface ICallSessionRepository
    {
        // 传入一个完整的包含 Messages 的 Session 对象，将其异步保存到数据库
        Task<CallSession> CreateSessionAsync(CallSession session);

        //获取分页列表 (直接投影成 DTO 以提升性能)
        Task<PagedResult<CallSessionDto>> GetSessionsAsync(CallSessionQueryObject query, string userId);

        // 获取单个详情 (包括具体的聊天消息)
        Task<CallSession?> GetSessionByIdAsync(int id, string userId);

        //删除某个会话
        Task<bool> DeleteSessionAsync(int id, string userId);

        Task<DashboardStatsDto> GetDashboardStatsAsync(string userId);
    }
}