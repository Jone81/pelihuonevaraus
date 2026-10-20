using Pelihuone.Application.Statistics;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

public static class StatisticsEndpoints
{
    public static IEndpointRouteBuilder MapStatisticsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/statistics")
            .WithTags("Statistics & Logging");

        group.MapGet("/", async (
            IStatisticsService statisticsService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var result = await statisticsService.GetStatisticsAsync(cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetStatistics")
        .WithSummary("Hae järjestelmän käyttöastetilastot ja varaushistoria (Admin)");

        return app;
    }
}
