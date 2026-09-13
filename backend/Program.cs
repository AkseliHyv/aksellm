using System.Text.Json.Serialization;
using backend.Filters;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddScoped<ILLMService, LLMService>();

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(corsPolicy);
app.MapControllers();

app.Run();