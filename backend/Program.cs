using System.Text.Json.Serialization;
using DotNetEnv;
using backend.Filters;
using backend.Services;

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

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ExceptionFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

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

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();