using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Pelihuone.Application.Games;
using Pelihuone.Application.GamingStations;
using Pelihuone.Application.Issues;
using Pelihuone.Application.News;
using Pelihuone.Application.Notifications;
using Pelihuone.Application.Reservations;
using Pelihuone.Application.Settings;
using Pelihuone.Application.Statistics;
using Pelihuone.Application.Users;

namespace Pelihuone.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddScoped<IReservationService, ReservationService>();
        services.AddScoped<IGamingStationService, GamingStationService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IGameService, GameService>();
        services.AddScoped<INewsService, NewsService>();
        services.AddScoped<IStatisticsService, StatisticsService>();
        services.AddSingleton<ISettingsService, SettingsService>();
        services.AddScoped<IDiscordNotificationService, DiscordNotificationService>();
        services.AddScoped<IIssueReportService, IssueReportService>();

        return services;
    }
}
