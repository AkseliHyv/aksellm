using System.Text.Json.Serialization;
using backend.Filters;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Load Supabase credentials from configuration into environment variables for the Supabase client to access
Environment.SetEnvironmentVariable("SUPABASE_URL", builder.Configuration["Supabase:Url"]);
Environment.SetEnvironmentVariable("SUPABASE_PUBLIC_KEY", builder.Configuration["Supabase:PublicKey"]);

// Configure CORS
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

// Configure controllers with filters
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ExceptionFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Register services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ILLMService, LLMService>();

// Configure OpenAPI
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(corsPolicy);
app.MapControllers();

app.Run();