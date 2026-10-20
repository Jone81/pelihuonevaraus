using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.GamingStations;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

public static class StationEndpoints
{
    public static IEndpointRouteBuilder MapStationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/stations")
            .WithTags("GamingStations");

        group.MapGet("/", async (
            IGamingStationService stationService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var result = await stationService.GetAllStationsAsync(cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetAllStations")
        .WithSummary("Hae kaikki aktiiviset pelipisteet");

        group.MapGet("/available", async (
            [FromQuery] DateTimeOffset startUtc,
            [FromQuery] DateTimeOffset endUtc,
            IGamingStationService stationService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var result = await stationService.GetAvailableStationsAsync(startUtc, endUtc, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetAvailableStations")
        .WithSummary("Laske reaaliaikaisesti vapaana olevat pelipisteet aikavälille (huomioi SharedTV-lukot)");

        return app;
    }
}
