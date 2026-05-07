using AICall.API.Data;
using AICall.API.Interfaces;
using AICall.API.Models;
using AICall.API.Repositories;
using AICall.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Environment variables override appsettings.json values (e.g. LLM__ApiKey, JWT__SigningKey)
builder.Configuration.AddEnvironmentVariables();

// 1. ע������������� JSON ���л�����
builder.Services.AddControllers().AddNewtonsoftJson(options =>
{
    options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
});
builder.Services.AddEndpointsApiExplorer();

// 2. ע�� Swagger (�� JWT ��֤����)
builder.Services.AddSwaggerGen(option =>
{
    option.SwaggerDoc("v1", new OpenApiInfo { Title = "AICall API", Version = "v1" });
    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "�����룺Bearer {���Token}",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });
    option.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[]{}
        }
    });
});

// 3. ���ÿ������ (CORS) ������ Vue ǰ�˷���
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowVueApp", policy =>
    {
        policy.WithOrigins("https://localhost:5175", "http://localhost:3000") // �滻Ϊ��� Vue ǰ�˵�ַ
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 4. ���ݿ�����������

builder.Services.AddDbContext<ApplicationDBContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});


// 5. ������֤�� JWT ���� 
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
}).AddEntityFrameworkStores<ApplicationDBContext>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultForbidScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultSignInScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultSignOutScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JWT:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JWT:Audience"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(builder.Configuration["JWT:SigningKey"]))
    };
});


// 6. ����ע������ (ҵ��㼶���������)
builder.Services.AddScoped<ICallSessionRepository, CallSessionRepository>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ILLMService, LLMService>();
builder.Services.AddScoped<ISpeechService, SpeechService>();
builder.Services.AddHttpClient(Microsoft.Extensions.Options.Options.DefaultName)//ע�� HttpClient ����������ʹ�� IHttpClientFactory �ı��벽��
    .ConfigurePrimaryHttpMessageHandler(() =>
    {
        return new HttpClientHandler
        {
            // ǿ�а����� HttpClient �ĵײ�����ָ����Ĵ����˿�
            Proxy = new System.Net.WebProxy("http://127.0.0.1:7897")
            {
                BypassProxyOnLocal = false
            },
            UseProxy = true
        };
    });
// Validate that required secrets are set (from env vars or appsettings.json)
var missingSecrets = new List<string>();
if (string.IsNullOrWhiteSpace(builder.Configuration["JWT:SigningKey"]) || builder.Configuration["JWT:SigningKey"]!.Length < 32)
    missingSecrets.Add("JWT:SigningKey (min 32 chars)");
if (string.IsNullOrWhiteSpace(builder.Configuration["LLM:ApiKey"]))
    missingSecrets.Add("LLM:ApiKey");
if (string.IsNullOrWhiteSpace(builder.Configuration["LLM:BaseUrl"]))
    missingSecrets.Add("LLM:BaseUrl");
if (string.IsNullOrWhiteSpace(builder.Configuration["ASR:ApiKey"]))
    missingSecrets.Add("ASR:ApiKey");
if (string.IsNullOrWhiteSpace(builder.Configuration["TTS:ApiKey"]))
    missingSecrets.Add("TTS:ApiKey");

if (missingSecrets.Count > 0)
{
    var msg = $"FATAL: Missing required configuration keys: {string.Join(", ", missingSecrets)}. " +
              "Set them in appsettings.json or via environment variables (e.g. LLM__ApiKey).";
    Console.Error.WriteLine(msg);
    throw new InvalidOperationException(msg);
}

var app = builder.Build();

// Global exception handler — must be the first middleware in the pipeline
app.UseMiddleware<AICall.API.Middleware.GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowVueApp"); // ���ÿ���
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();