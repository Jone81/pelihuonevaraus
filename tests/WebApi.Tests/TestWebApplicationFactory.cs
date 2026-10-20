using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Infrastructure.Outbox;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.WebApi.Tests;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll(typeof(DbContextOptions<ApplicationDbContext>));
            services.RemoveAll(typeof(DbContextOptions));
            services.RemoveAll(typeof(ApplicationDbContext));
            services.RemoveAll(typeof(IUnitOfWork));

            var inMemoryProvider = new ServiceCollection()
                .AddEntityFrameworkInMemoryDatabase()
                .BuildServiceProvider();

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
