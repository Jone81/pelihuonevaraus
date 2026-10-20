using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Infrastructure.Outbox;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Integration.Tests;

public class IntegrationTestFactory : WebApplicationFactory<Program>
{
    private readonly string? _connectionString;

    public IntegrationTestFactory(string? connectionString)
    {
        _connectionString = connectionString;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        if (string.IsNullOrEmpty(_connectionString))
        {
            return;
        }

        builder.ConfigureServices(services =>
        {
            services.RemoveAll(typeof(DbContextOptions<ApplicationDbContext>));
            services.RemoveAll(typeof(DbContextOptions));
            services.RemoveAll(typeof(ApplicationDbContext));
            services.RemoveAll(typeof(IUnitOfWork));

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
