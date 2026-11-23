using MediatR;
using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Common;
using Pelihuone.Application.Features.Stations.Commands;
using Pelihuone.Application.Features.Stations.Queries;
using Pelihuone.Application.Features.Users.Queries;
using Pelihuone.Contracts.GamingStations;
using Pelihuone.Contracts.Users;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

/// <summary>
/// Sisältää pelipisteiden, niiden saatavuuden tarkistamiseen sekä huoltotilan hallintaan liittyvät HTTP-päätepisteet.
/// </summary>
public static class StationEndpoints
{
    /// <summary>
    /// Rekisteröi pelipisteiden listaukseen, vapaiden pisteiden hakuun ja tilan muokkaukseen käytettävät päätepisteet.
    /// </summary>
    /// <param name="app">Sovelluksen päätepisteiden reititysrakentaja.</param>
    /// <returns>Päivitetty reititysrakentaja ketjutusta varten.</returns>
    public static IEndpointRouteBuilder MapStationEndpoints(this IEndpointRouteBuilder app)
    {
        // Luodaan reittiryhmä pelipisteille
        RouteGroupBuilder group = app.MapGroup("/api/stations")
            .WithTags("GamingStations");

        // Hae kaikki aktiiviset pelipisteet
        group.MapGet("/", async (
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Haetaan kaikki käytössä olevat pelipisteet
            Result<IReadOnlyList<GamingStationResponse>> result = await sender.Send(
                new GetStationsQuery(),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetAllStations")
        .WithSummary("Hae kaikki aktiiviset pelipisteet");

        // Hae kaikki pelipisteet (myös huoltotilassa olevat) ylläpitonäkymää varten
        group.MapGet("/admin", async (
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            Result<IReadOnlyList<GamingStationResponse>> result = await sender.Send(
                new GetAdminStationsQuery(),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetAllStationsForAdmin")
        .WithSummary("Hae kaikki pelipisteet mukaan lukien huoltotilassa olevat (Admin)");

        // Laske vapaana olevat pelipisteet annetulle aikavälille
        group.MapGet("/available", async (
            [FromQuery] DateTimeOffset startUtc,
            [FromQuery] DateTimeOffset endUtc,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Lasketaan reaaliaikaisesti vapaat pelipisteet huomioiden tilavaraukset ja jaetun TV:n rajoitteet
            Result<IReadOnlyList<GamingStationResponse>> result = await sender.Send(
                new GetAvailableStationsQuery(startUtc, endUtc),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetAvailableStations")
        .WithSummary("Laske reaaliaikaisesti vapaana olevat pelipisteet aikavälille (huomioi SharedTV-lukot)");

        // Päivitä yksittäisen pelipisteen käyttötila (Käytössä / Huollossa)
        group.MapPut("/{id:guid}/status", async (
            Guid id,
            [FromHeader(Name = "X-User-Id")] Guid? headerUserId,
            [FromBody] UpdateGamingStationStatusRequest request,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (!headerUserId.HasValue)
            {
                return Results.Unauthorized();
            }

            Result<UserResponse> userResult = await sender.Send(
                new GetUserByIdQuery(headerUserId.Value),
                cancellationToken);
            if (!userResult.IsSuccess || (userResult.Value.Role != "Admin" && userResult.Value.Role != "SuperAdmin"))
            {
                return Results.StatusCode(StatusCodes.Status403Forbidden);
            }

            Result<GamingStationResponse> result = await sender.Send(
                new UpdateStationStatusCommand(id, request),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("UpdateStationStatus")
        .WithSummary("Aseta pelipiste käyttöön tai huoltotilaan (Admin / SuperAdmin)");

        return app;
    }
}
