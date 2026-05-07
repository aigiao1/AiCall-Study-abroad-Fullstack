using System.Net;
using System.Text.Json;
using AICall.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace AICall.API.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public GlobalExceptionMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionMiddleware> logger,
            IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (OperationCanceledException)
            {
                // Client disconnected — not a server error, suppress
                _logger.LogInformation("Request cancelled by client: {Path}", context.Request.Path);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);

                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.ContentType = "application/problem+json";

                var traceId = context.TraceIdentifier;
                var response = new ApiErrorResponse
                {
                    TraceId = traceId,
                    Status = 500,
                    Title = "An unexpected error occurred.",
                    Detail = _env.IsDevelopment()
                        ? ex.Message
                        : "The server encountered an internal error. Please reference the TraceId if you contact support."
                };

                var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                await context.Response.WriteAsync(json);
            }
        }
    }
}
