using Testcontainers.PostgreSql;
using Xunit;

namespace Pelihuone.Integration.Tests;

/// <summary>
/// Hallinnoi väliaikaisen PostgreSQL Docker -kontin elinkaarta integraatio- ja kuormitustestejä varten.
/// </summary>
public class PostgreSqlTestcontainersFixture : IAsyncLifetime
{
    /// <summary>
    /// Käynnissä oleva PostgreSQL-testikontti tai <c>null</c>, jos Docker ei ole saatavilla.
    /// </summary>
    public PostgreSqlContainer? Container { get; private set; }

    /// <summary>
    /// Ilmaisee, onko paikallinen Docker-palvelu käytettävissä ja testikontti käynnistetty onnistuneesti.
    /// </summary>
    public bool IsDockerAvailable { get; private set; }

    /// <summary>
    /// Rakentaa ja käynnistää PostgreSQL 16 -kontin ennen testien suoritusta.
    /// </summary>
    /// <returns>Asynkroninen tehtävä.</returns>
    public async Task InitializeAsync()
    {
        try
        {
            // Määritellään ja käynnistetään kevyellä Alpine-pohjalla toimiva PostgreSQL 16 -kontti
            Container = new PostgreSqlBuilder("postgres:16-alpine")
                .WithDatabase("pelihuone_integration")
                .WithUsername("postgres")
                .WithPassword("postgres")
                .Build();

            await Container.StartAsync();
            IsDockerAvailable = true;
        }
        catch
        {
            // Host-koneella ei ole Docker-daemonia saatavilla
            IsDockerAvailable = false;
            Container = null;
        }
    }

    /// <summary>
    /// Pysäyttää ja poistaa PostgreSQL-testikontin testien päätyttyä.
    /// </summary>
    /// <returns>Asynkroninen tehtävä.</returns>
    public async Task DisposeAsync()
    {
        // Siivotaan konttiresurssit ajon päätteeksi
        if (Container is not null)
        {
            await Container.DisposeAsync();
        }
    }
}
