using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Infrastructure.Outbox;
using Pelihuone.Infrastructure.Persistence;
using Pelihuone.Infrastructure.Repositories;
using Pelihuone.Infrastructure.Services;

namespace Pelihuone.Infrastructure;

/// <summary>
/// Tarjoaa laajennusmetodit Infrastructure-kerroksen palveluiden, tietokantakontekstin ja repositorioiden
/// rekisteröimiseksi sovelluksen riippuvuuksien injektointikonttiin (DI).
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Rekisteröi Infrastructure-kerroksen riippuvuudet, kuten aikapalvelun, Outbox-siepparin,
    /// tietokantakontekstin (PostgreSQL tai muistitietokanta) sekä repositoriot.
    /// </summary>
    /// <param name="services">Palvelukokoelma, johon riippuvuudet rekisteröidään.</param>
    /// <param name="configuration">Sovelluksen konfiguraatio yhteysmerkkijonojen ja asetusten lukemiseen.</param>
    /// <returns>Päivitetty <see cref="IServiceCollection"/>-instanssi ketjutusta varten.</returns>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Rekisteröidään järjestelmän aikapalvelu singletonina koko sovelluksen käyttöön
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();

        // Rekisteröidään Outbox-sieppari domain-tapahtumien tallentamiseksi tietokantaan
        services.AddSingleton<OutboxInterceptor>();

        // Haetaan tietokannan yhteysmerkkijono konfiguraatiosta
        string? configuredConnStr = configuration.GetConnectionString("Database")
            ?? configuration.GetConnectionString("DefaultConnection");

        // Tarkistetaan haluttu tietokantatoimittaja (oletuksena automaattinen tunnistus)
        string provider = configuration["DatabaseProvider"] ?? "Auto";
        string npgsqlConnStr = configuredConnStr ?? "Host=localhost;Database=pelihuone;Username=postgres;Password=postgres";

        // Testataan, voidaanko PostgreSQL-tietokantaan muodostaa yhteys
        bool canUsePostgres = false;
        if (!provider.Equals("InMemory", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                using Npgsql.NpgsqlConnection testConn = new Npgsql.NpgsqlConnection(npgsqlConnStr);
                testConn.Open();
                canUsePostgres = true;
            }
            catch
            {
                // Jos yhteys epäonnistuu, siirrytään käyttämään muistitietokantaa (InMemory)
                canUsePostgres = false;
            }
        }

        // Konfiguroidaan EF Coren ApplicationDbContext ja liitetään OutboxInterceptor mukaan
        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            OutboxInterceptor outboxInterceptor = sp.GetRequiredService<OutboxInterceptor>();

            if (canUsePostgres)
            {
                // Käytetään PostgreSQL-kantaa ja määritetään migraatioiden sijaintikokoonpano
                options.UseNpgsql(npgsqlConnStr, npgsqlOptions =>
                {
                    npgsqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                })
                .AddInterceptors(outboxInterceptor);
            }
            else
            {
                // Käytetään EF Coren muistitietokantaa kehitys- ja testiympäristöissä, kun PostgreSQL ei ole saatavilla
                options.UseInMemoryDatabase("PelihuoneDevDb")
                    .AddInterceptors(outboxInterceptor);
            }
        });

        // Rekisteröidään Unit of Work ja kaikki domain-repositoriot Scoped-elinkaarella
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IReservationRepository, ReservationRepository>();
        services.AddScoped<IGamingStationRepository, GamingStationRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IGameRepository, GameRepository>();
        services.AddScoped<INewsRepository, NewsRepository>();
        services.AddScoped<IGameRoomRepository, GameRoomRepository>();
        services.AddScoped<IIssueReportRepository, IssueReportRepository>();

        return services;
    }
}
