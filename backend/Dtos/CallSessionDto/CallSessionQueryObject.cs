namespace AICall.API.Dtos.Conversation
{
    public class CallSessionQueryObject
    {
        // 第几页，默认第1页
        public int PageNumber { get; set; } = 1;
        // 每页多少条，默认3条
        public int PageSize { get; set; } = 3;
        // 可以加一个可选的按分类搜索
        public string? Category { get; set; }
    }
}