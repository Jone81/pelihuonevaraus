using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Infrastructure.Outbox;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.WebApi.Tests;

/// <summary>
/// WebApi-integraatiotesteissä käytettävä <see cref="WebApplicationFactory{TEntryPoint}"/>, joka korvaa
/// PostgreSQL-tietokannan eristetyllä EF Core InMemory -tietokannalla.
/// </summary>
public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = Guid.NewGuid().ToString();

    /// <summary>
    /// Konfiguroi testisovelluksen palvelut käyttämään muistinsisäistä tietokantaa ja <see cref="OutboxInterceptor"/>-siepparia.
    /// </summary>
    /// <param name="builder">Web-isännän rakentaja.</param>
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Poistetaan tuotannon/kehityksen oletustietokantarekisteröinnit
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
            services.RemoveAll<DbContextOptions>();
            services.RemoveAll<ApplicationDbContext>();
            services.RemoveAll<IUnitOfWork>();

            // Rakennetaan erillinen sisäinen palveluntarjoaja InMemory-tietokantaa varten
            var inMemoryProvider = new ServiceCollection()
                .AddEntityFrameworkInMemoryDatabase()
                .BuildServiceProvider();

            // Rekisteröidään muistitietokanta yksilöllisellä nimellä ja Outbox-siepparilla
            services.AddDbContext<ApplicationDbContext>((sp, options) =>
            {
                var outboxInterceptor = sp.GetRequiredService<OutboxInterceptor>();
                options.UseInternalServiceProvider(inMemoryProvider);
                options.UseInMemoryDatabase(_databaseName);
                options.AddInterceptors(outboxInterceptor);
            });

            services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ApplicationDbContext>());
        });
    }
}
