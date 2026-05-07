using System.Text.Json.Serialization;

namespace AICall.API.Dtos.Conversation
{
    public class LLMSummaryResultDto
    {
        [JsonPropertyName("background")]
        public string Background { get; set; }

        [JsonPropertyName("intention")]
        public string Intention { get; set; }

        [JsonPropertyName("needs")]
        public string Needs { get; set; }

        [JsonPropertyName("followUp")]
        public string FollowUp { get; set; }

        // implicit conversion removed; keep DTO as a plain data holder
    }
}
