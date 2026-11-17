using Pelihuone.Application;
using Pelihuone.Infrastructure;
using Pelihuone.WebApi.Endpoints;
using Pelihuone.WebApi.Extensions;
using Pelihuone.WebApi.Middleware;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddApiRateLimiting();

WebApplication app = builder.Build();

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
using (IServiceScope scope = app.Services.CreateScope())
{
    Pelihuone.Infrastructure.Persistence.ApplicationDbContext dbContext = scope.ServiceProvider.GetRequiredService<Pelihuone.Infrastructure.Persistence.ApplicationDbContext>();
    ILogger<Program> logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    await Pelihuone.Infrastructure.Persistence.DatabaseSeeder.SeedAsync(dbContext, logger);
}

// Rekisteröidään prosessitason hätäkuuntelija kriittisille kaatumisille
AppDomain.CurrentDomain.UnhandledException += (object sender, UnhandledExceptionEventArgs eventArgs) =>
{
    if (eventArgs.ExceptionObject is Exception fatalException)
    {
        try
        {
            using IServiceScope emergencyScope = app.Services.CreateScope();
            Pelihuone.Application.Abstractions.Services.IErrorNotificationService errorNotifier =
                emergencyScope.ServiceProvider.GetRequiredService<Pelihuone.Application.Abstractions.Services.IErrorNotificationService>();
            errorNotifier.SendErrorAlertAsync(
                fatalException,
                "AppDomain.UnhandledException (Kriittinen palvelinkaatuminen)",
                null,
                CancellationToken.None).GetAwaiter().GetResult();
        }
        catch
        {
            // Vaimennetaan kaatumisen aikainen toissijainen poikkeus
        }
    }
};

app.Run();

// Tehdään Program-luokasta julkinen WebApplicationFactory-integraatiotestejä varten
/// <summary>
/// WebApi-sovelluksen käynnistyspiste, jota käytetään myös integraatiotestien <c>WebApplicationFactory&lt;Program&gt;</c>-alustuksessa.
/// </summary>
public partial class Program { }
