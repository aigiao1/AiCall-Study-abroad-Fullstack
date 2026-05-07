namespace AICall.API.Interfaces
{
    public interface ISpeechService
    {
        Task<string> SpeechToTextAsync(IFormFile file);
        Task<byte[]> TextToSpeechAsync(string text);

    }
}
