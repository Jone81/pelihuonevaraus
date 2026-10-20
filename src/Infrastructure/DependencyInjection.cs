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

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();

        services.AddSingleton<OutboxInterceptor>();

        string? configuredConnStr = configuration.GetConnectionString("Database")
            ?? configuration.GetConnectionString("DefaultConnection");

        string provider = configuration["DatabaseProvider"] ?? "Auto";
        string npgsqlConnStr = configuredConnStr ?? "Host=localhost;Database=pelihuone;Username=postgres;Password=postgres";

        bool canUsePostgres = false;
        if (!provider.Equals("InMemory", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                using var testConn = new Npgsql.NpgsqlConnection(npgsqlConnStr);
                testConn.Open();
                canUsePostgres = true;
            }
            catch
            {
                canUsePostgres = false;
            }
        }

        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            var outboxInterceptor = sp.GetRequiredService<OutboxInterceptor>();

            if (canUsePostgres)
            {
                options.UseNpgsql(npgsqlConnStr, npgsqlOptions =>
                {
                    npgsqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                })
                .AddInterceptors(outboxInterceptor);
            }
            else
            {
                options.UseInMemoryDatabase("PelihuoneDevDb")
                    .AddInterceptors(outboxInterceptor);
            }
        });

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
