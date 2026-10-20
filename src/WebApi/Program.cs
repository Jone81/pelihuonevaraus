using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Pelihuone.Application;
using Pelihuone.Infrastructure;
using Pelihuone.WebApi.Endpoints;
using Pelihuone.WebApi.Middleware;

var builder = WebApplication.CreateBuilder(args);

// 1. Rekisteröidään sovelluskerrokset DI-eristyssääntöjen mukaisesti
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// 2. RFC 9457 ProblemDetails & Global Exception Handler
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// 3. OpenAPI-tuki ja Health Checks
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();
builder.Services.AddHttpClient();

// 4. CORS Client-sovellukselle (React + Vite)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// 5. Rate Limiting (Pyyntöjen rajoitus turhic- ja spämmiskriptejä vastaan)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.OnRejected = async (context, cancellationToken) =>
    {
        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Liikaa pyyntöjä",
            Detail = "Olet ylittänyt sallitun pyyntömäärän. Yritä uudelleen hetken kuluttua.",
            Type = "https://tools.ietf.org/html/rfc6585#section-4",
            Instance = context.HttpContext.Request.Path
        };
        await context.HttpContext.Response.WriteAsJsonAsync(
            problem,
            typeof(ProblemDetails),
            options: null,
            contentType: "application/problem+json",
            cancellationToken: cancellationToken);
    };

    // Varauspäätepisteiden rajoitus: 10 pyyntöä per minuutti per IP
    options.AddPolicy("ReservationPolicy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // Autentikointipäätepisteen rajoitus: 5 pyyntöä per minuutti per IP
    options.AddPolicy("AuthPolicy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
});

var app = builder.Build();

// Pipeline-konfiguraatio
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowClient");
app.UseRateLimiter();

// Endpoints
app.MapReservationEndpoints();
app.MapStationEndpoints();
app.MapAuthEndpoints();
app.MapGameEndpoints();
app.MapNewsEndpoints();
app.MapStatisticsEndpoints();
app.MapSettingsEndpoints();
app.MapIssueEndpoints();

// Health Checks
app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready");

// Alustetaan ja siemennetään tietokanta kehityskäyttöön
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<Pelihuone.Infrastructure.Persistence.ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    await Pelihuone.Infrastructure.Persistence.DatabaseSeeder.SeedAsync(dbContext, logger);
}

app.Run();

// Tehdään Program-luokasta julkinen WebApplicationFactory-integraatiotestejä varten
public partial class Program { }
