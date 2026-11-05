using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.GamingStations;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

/// <summary>
/// Sisältää pelipisteiden ja niiden saatavuuden tarkistamiseen liittyvät HTTP-päätepisteet.
/// </summary>
public static class StationEndpoints
{
    /// <summary>
    /// Rekisteröi pelipisteiden listaukseen ja vapaiden pisteiden hakuun käytettävät päätepisteet.
    /// </summary>
    /// <param name="app">Sovelluksen päätepisteiden reititysrakentaja.</param>
    /// <returns>Päivitetty reititysrakentaja ketjutusta varten.</returns>
    public static IEndpointRouteBuilder MapStationEndpoints(this IEndpointRouteBuilder app)
    {
        // Luodaan reittiryhmä pelipisteille
        var group = app.MapGroup("/api/stations")
            .WithTags("GamingStations");

        // Hae kaikki aktiiviset pelipisteet
        group.MapGet("/", async (
            IGamingStationService stationService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Haetaan kaikki käytössä olevat pelipisteet
            var result = await stationService.GetAllStationsAsync(cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetAllStations")
        .WithSummary("Hae kaikki aktiiviset pelipisteet");

        // Laske vapaana olevat pelipisteet annetulle aikavälille
        group.MapGet("/available", async (
            [FromQuery] DateTimeOffset startUtc,
            [FromQuery] DateTimeOffset endUtc,
            IGamingStationService stationService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Lasketaan reaaliaikaisesti vapaat pelipisteet huomioiden tilavaraukset ja jaetun TV:n rajoitteet
            var result = await stationService.GetAvailableStationsAsync(startUtc, endUtc, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetAvailableStations")
        .WithSummary("Laske reaaliaikaisesti vapaana olevat pelipisteet aikavälille (huomioi SharedTV-lukot)");

        return app;
    }
}
