using Testcontainers.PostgreSql;
using Xunit;

namespace Pelihuone.Integration.Tests;

public class PostgreSqlTestcontainersFixture : IAsyncLifetime
{
    public PostgreSqlContainer? Container { get; private set; }
    public bool IsDockerAvailable { get; private set; }

    public async Task InitializeAsync()
    {
        try
        {
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

    public async Task DisposeAsync()
    {
        if (Container is not null)
        {
            await Container.DisposeAsync();
        }
    }
}
