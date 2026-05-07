namespace AICall.API.Models
{
    public class ApiErrorResponse
    {
        public string TraceId { get; set; } = string.Empty;
        public int Status { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
    }
}
