using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Infrastructure.Outbox;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Integration.Tests;

/// <summary>
/// Integraatiotesteissä käytettävä <see cref="WebApplicationFactory{TEntryPoint}"/>, joka kytkee sovelluksen
/// Testcontainersin tarjoamaan PostgreSQL-tietokantaan.
/// </summary>
public class IntegrationTestFactory : WebApplicationFactory<Program>
{
    private readonly string? _connectionString;

    /// <summary>
    /// Alustaa uuden <see cref="IntegrationTestFactory"/>-instanssin annetulla tietokannan yhteysmerkkijonolla.
    /// </summary>
    /// <param name="connectionString">PostgreSQL-testikontin yhteysmerkkijono.</param>
    public IntegrationTestFactory(string? connectionString)
    {
        _connectionString = connectionString;
    }

    /// <summary>
    /// Mukauttaa web-palvelimen riippuvuudet korvaamalla oletustietokantakontekstin PostgreSQL-testiyhteydellä.
    /// </summary>
    /// <param name="builder">Web-isännän rakentaja.</param>
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Jos yhteysmerkkijonoa ei ole annettu, ei muokata tietokantarekisteröintejä
        if (string.IsNullOrEmpty(_connectionString))
        {
            return;
        }

        builder.ConfigureServices(services =>
        {
            // Poistetaan oletusarvoiset tietokantarekisteröinnit
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
            services.RemoveAll<DbContextOptions>();
            services.RemoveAll<ApplicationDbContext>();
            services.RemoveAll<IUnitOfWork>();

            // Rekisteröidään Npgsql-pohjainen tietokantakonteksti Outbox-siepparilla
            services.AddDbContext<ApplicationDbContext>((sp, options) =>
            {
                var outboxInterceptor = sp.GetRequiredService<OutboxInterceptor>();
                options.UseNpgsql(_connectionString)
                    .AddInterceptors(outboxInterceptor);
            });

            services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ApplicationDbContext>());
        });
    }
}
