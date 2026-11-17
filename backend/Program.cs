using System.Text;
using System.Text.Json.Serialization;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using backend.Filters;
using backend.Helpers;
using backend.Services;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    Env.TraversePath().Load();
    builder.Configuration.AddEnvironmentVariables();
}

if (string.IsNullOrWhiteSpace(builder.Configuration["Supabase:Url"]) ||
    string.IsNullOrWhiteSpace(builder.Configuration["Supabase:PublicKey"]))
    throw new InvalidOperationException(
        "Supabase is not configured. Set Supabase:Url and Supabase:PublicKey (Supabase__Url and Supabase__PublicKey as environment variables).");

Environment.SetEnvironmentVariable("SUPABASE_URL", builder.Configuration["Supabase:Url"]);
Environment.SetEnvironmentVariable("SUPABASE_PUBLIC_KEY", builder.Configuration["Supabase:PublicKey"]);

const string corsPolicy = "AllowFrontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicy, policy =>
    {
        policy.WithOrigins(builder.Configuration["AllowedOrigins"]!.Split(","))
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var supabaseUrl = builder.Configuration["Supabase:Url"]!.TrimEnd('/');
var supabaseJwtSecret = builder.Configuration["Supabase:JwtSecret"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.MapInboundClaims = false;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidIssuer = $"{supabaseUrl}/auth/v1",
        ValidAudience = "authenticated",
        ClockSkew = TimeSpan.Zero
    };

    if (!string.IsNullOrWhiteSpace(supabaseJwtSecret))
    {
        options.TokenValidationParameters.IssuerSigningKey =
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(supabaseJwtSecret));
    }
    else
    {
        options.ConfigurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            $"{supabaseUrl}/auth/v1/.well-known/jwks.json",
            new JwksRetriever(),
            new HttpDocumentRetriever { RequireHttps = supabaseUrl.StartsWith("https://") });
    }

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = ctx =>
        {
            ctx.Token = ctx.Request.Cookies["token"];
            return Task.CompletedTask;
        },
        OnChallenge = async ctx =>
        {
            ctx.HandleResponse();
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await ctx.Response.WriteAsJsonAsync(new { message = "Unauthorized. Please authenticate and try again." });
        }
    };
});

builder.Services.AddRateLimiter(options =>
{
    options.OnRejected = async (context, cancellationToken) =>
    {
        var response = context.HttpContext.Response;

        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            response.Headers.RetryAfter = ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();

        response.StatusCode = StatusCodes.Status429TooManyRequests;
        await response.WriteAsJsonAsync(new { message = "Too many requests. Please try again shortly." }, cancellationToken);
    };

    options.AddPolicy(RateLimitHelper.Auth, context =>
        RateLimitPartition.GetSlidingWindowLimiter(RateLimitHelper.GetClientKey(context), _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 6
        }));

    options.AddPolicy(RateLimitHelper.Refresh, context =>
        RateLimitPartition.GetFixedWindowLimiter(RateLimitHelper.GetClientKey(context), _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 30,
            Window = TimeSpan.FromMinutes(1)
        }));

    options.AddPolicy(RateLimitHelper.Chat, context =>
        RateLimitPartition.GetConcurrencyLimiter(RateLimitHelper.GetUserKey(context), _ => new ConcurrencyLimiterOptions
        {
            PermitLimit = 1,
            QueueLimit = 0
        }));

    options.AddPolicy(RateLimitHelper.General, context =>
        RateLimitPartition.GetFixedWindowLimiter(RateLimitHelper.GetUserKey(context), _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 120,
            Window = TimeSpan.FromMinutes(1)
        }));
});

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ExceptionFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddScoped<ISupabaseUserClient, SupabaseUserClient>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpClient<ILLMService, LLMService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Ollama:BaseUrl"] ?? "http://localhost:11434");
    client.Timeout = TimeSpan.FromMinutes(5);
});

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseCors(corsPolicy);

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();