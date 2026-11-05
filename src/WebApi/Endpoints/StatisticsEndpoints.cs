using Pelihuone.Application.Common;
using Pelihuone.Application.Statistics;
using Pelihuone.Contracts.Statistics;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

/// <summary>
/// Sisältää pelihuoneen käyttöastetilastoihin ja analytiikkaan liittyvät HTTP-päätepisteet.
/// </summary>
public static class StatisticsEndpoints
{
    /// <summary>
    /// Rekisteröi tilastojen ja varaushistorian hakuun käytettävät päätepisteet reititykseen.
    /// </summary>
    /// <param name="app">Sovelluksen päätepisteiden reititysrakentaja.</param>
    /// <returns>Päivitetty reititysrakentaja ketjutusta varten.</returns>
    public static IEndpointRouteBuilder MapStatisticsEndpoints(this IEndpointRouteBuilder app)
    {
        // Luodaan reittiryhmä tilastoille
        RouteGroupBuilder group = app.MapGroup("/api/statistics")
            .WithTags("Statistics & Logging");

        // Hae järjestelmän tilastot
        group.MapGet("/", async (
            IStatisticsService statisticsService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Haetaan koostetut käyttöastetilastot ja laitekohtaiset varausmäärät
            Result<StatisticsResponse> result = await statisticsService.GetStatisticsAsync(cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetStatistics")
        .WithSummary("Hae järjestelmän käyttöastetilastot ja varaushistoria (Admin)");

        return app;
    }
}
