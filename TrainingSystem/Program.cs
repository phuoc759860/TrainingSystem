using TrainingSystem.Data;
using TrainingSystem.Hubs;
using TrainingSystem.Middlewares;
using TrainingSystem.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.FileProviders;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = new LowerFirstNamingPolicy();
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connStr = builder.Configuration.GetConnectionString("DefaultConnection");
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(databaseUrl))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    connStr = $"Server={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};User={userInfo[0]};Password={userInfo[1]};";
}

var jwtKey = builder.Configuration["Jwt:Key"];
ValidateStartupSecrets(connStr, jwtKey);

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(
        connStr,
        new MySqlServerVersion(new Version(8, 0, 36)));
});

builder.Services.AddSingleton<LoginRateLimiter>();
builder.Services.AddSingleton<RateLimiterService>(_ =>
{
    var rl = new RateLimiterService();
    rl.Configure("register", 10, 60);
    rl.Configure("message", 20, 60);
    rl.Configure("forum", 10, 60);
    rl.Configure("resetpw", 5, 60);
    return rl;
});
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddSignalR();
builder.Services.AddScoped<FileValidationService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),

        RoleClaimType = ClaimTypes.Role,
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(accessToken))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        },
        OnTokenValidated = async context =>
        {
            var jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
            if (jti == null) return;

            var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var isRevoked = await db.RevokedTokens.AnyAsync(r => r.Jti == jti);
            if (isRevoked)
            {
                context.Fail("Token has been revoked.");
            }
        }
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        var frontendUrl = builder.Configuration["FrontendUrl"] ?? "http://localhost:5173";
        policy
            .WithOrigins(frontendUrl)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();

var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadsPath);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseHttpsRedirection();
}
else
{
    var port = Environment.GetEnvironmentVariable("PORT") ?? "5149";
    app.Urls.Add($"http://0.0.0.0:{port}");
}

app.UseCors("ReactPolicy");

app.UseAuthentication();

app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var cutoff = DateTime.UtcNow.AddDays(-1);
    var expired = await db.RevokedTokens.Where(r => r.ExpiresAt < cutoff).ToListAsync();
    if (expired.Count > 0)
    {
        db.RevokedTokens.RemoveRange(expired);
        await db.SaveChangesAsync();
    }
}

app.Run();

static void ValidateStartupSecrets(string? connectionString, string? jwtKey)
{
    var knownWeakKeys = new HashSet<string>(StringComparer.Ordinal)
    {
        "CHANGE_ME",
        "REDACTED",
        "REPLACE_WITH_SECRET_KEY_IN_RENDER_ENV_VARS",
        ""
    };

    if (string.IsNullOrWhiteSpace(jwtKey) || knownWeakKeys.Contains(jwtKey))
    {
        throw new InvalidOperationException(
            "Jwt:Key is not securely configured. Set the Jwt__Key environment variable " +
            "(or a local user-secret: `dotnet user-secrets set \"Jwt:Key\" \"<long-random-value>\"`) " +
            "to a unique, long random value before starting the app.");
    }

    if (string.IsNullOrWhiteSpace(connectionString) ||
        connectionString.Contains("CHANGE_ME", StringComparison.Ordinal))
    {
        throw new InvalidOperationException(
            "The database connection string is not configured. Set the " +
            "ConnectionStrings__DefaultConnection environment variable " +
            "(or DATABASE_URL when deploying to Render), or a local user-secret " +
            "(`dotnet user-secrets set \"ConnectionStrings:DefaultConnection\" \"<connection-string>\"`).");
    }
}

public class LowerFirstNamingPolicy : JsonNamingPolicy
{
    public override string ConvertName(string name) =>
        string.IsNullOrEmpty(name) ? name : char.ToLowerInvariant(name[0]) + name[1..];
}
