using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common.Behaviors;
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
/// Sisältää laajennusmetodit sovelluskerroksen palveluiden, MediatR-käsittelijöiden ja validaattoreiden rekisteröimiseen riippuvuuksien injektointikonttiin (DI).
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Rekisteröi sovelluskerroksen käyttötapauspalvelut, MediatR-CQRS-putken ja FluentValidation-validaattorit.
    /// </summary>
    /// <param name="services">Palvelukokoelma, johon riippuvuudet rekisteröidään.</param>
    /// <returns>Päivitetty palvelukokoelma ketjutusta varten.</returns>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Rekisteröidään MediatR-käsittelijät ja putken poikkileikkaavat käyttäytymiset määrätyssä järjestyksessä
        services.AddMediatR(configuration =>
        {
            configuration.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            configuration.AddOpenBehavior(typeof(LoggingBehavior<,>));
            configuration.AddOpenBehavior(typeof(ValidationBehavior<,>));
            configuration.AddOpenBehavior(typeof(CachingBehavior<,>));
        });

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
        services.AddScoped<IErrorNotificationService, ErrorNotificationService>();
        services.AddScoped<IIssueReportService, IssueReportService>();

        return services;
    }
}
