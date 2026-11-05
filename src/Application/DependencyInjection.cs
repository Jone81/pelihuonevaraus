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

/// <summary>
/// Sisältää laajennusmetodit sovelluskerroksen palveluiden ja validaattoreiden rekisteröimiseen riippuvuuksien injektointikonttiin (DI).
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Rekisteröi sovelluskerroksen käyttötapauspalvelut ja FluentValidation-validaattorit.
    /// </summary>
    /// <param name="services">Palvelukokoelma, johon riippuvuudet rekisteröidään.</param>
    /// <returns>Päivitetty palvelukokoelma ketjutusta varten.</returns>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Rekisteröidään kaikki tämän assemblyn FluentValidation-validaattorit automaattisesti
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        // Rekisteröidään sovelluskerroksen liiketoimintapalvelut
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
