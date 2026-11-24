using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

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
    /// Mukauttaa web-palvelimen konfiguraation välittämällä PostgreSQL-testiyhteyden ennen palveluiden rekisteröintiä,
    /// jotta sovellus rekisteröi suoraan vain yhden EF Core -tietokantatoimittajan (Npgsql).
    /// </summary>
    /// <param name="builder">Web-isännän rakentaja.</param>
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Jos yhteysmerkkijonoa ei ole annettu, ei muokata tietokantakonfiguraatiota
        if (string.IsNullOrEmpty(_connectionString))
        {
            return;
        }

        // Välitetään Testcontainers-yhteysmerkkijono ja PostgreSQL-toimittaja konfiguraationa ennen AddInfrastructure-kutsua
        builder.UseSetting("ConnectionStrings:Database", _connectionString);
        builder.UseSetting("DatabaseProvider", "PostgreSQL");
    }
}
