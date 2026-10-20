using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Reservations;
using Pelihuone.Contracts.Reservations;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

public static class ReservationEndpoints
{
    public static IEndpointRouteBuilder MapReservationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reservations")
            .WithTags("Reservations");

        group.MapPost("/", async (
            [FromBody] CreateReservationRequest request,
            IReservationService reservationService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var result = await reservationService.CreateReservationAsync(request, cancellationToken);
            return result.ToHttpResult(httpContext, response =>
                Results.Created($"/api/reservations/{response.Id}", response));
        })
        .RequireRateLimiting("ReservationPolicy")
        .WithName("CreateReservation")
        .WithSummary("Luo uusi varaus pelipisteelle, tilalle tai tapahtumalle");

        group.MapDelete("/{id:guid}", async (
            Guid id,
            [FromBody] CancelReservationRequest request,
            IReservationService reservationService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var result = await reservationService.CancelReservationAsync(id, request, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .RequireRateLimiting("ReservationPolicy")
        .WithName("CancelReservation")
        .WithSummary("Peruuta voimassa oleva varaus ennen sen alkamisaikaa");

        group.MapPost("/override", async (
            [FromBody] OverrideReservationRequest request,
            IReservationService reservationService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var result = await reservationService.OverrideAndCreateEventAsync(
                request.ReservationRequest,
                request.Reason,
                cancellationToken);

            return result.ToHttpResult(httpContext, response =>
                Results.Created($"/api/reservations/{response.Id}", response));
        })
        .WithName("OverrideReservation")
        .WithSummary("SuperAdmin: Jyrää ristiriitaiset varaukset ja luo tapahtuma");

        group.MapGet("/{id:guid}", async (
            Guid id,
            IReservationService reservationService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var result = await reservationService.GetByIdAsync(id, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetReservationById")
        .WithSummary("Hae varauksen tiedot tunnisteella");

        group.MapGet("/", async (
            [FromQuery] DateTimeOffset startUtc,
            [FromQuery] DateTimeOffset endUtc,
            IReservationService reservationService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var result = await reservationService.GetActiveReservationsAsync(startUtc, endUtc, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetActiveReservations")
        .WithSummary("Hae aktiiviset varaukset aikaväliltä");

        return app;
    }
}

public sealed record OverrideReservationRequest(
    CreateReservationRequest ReservationRequest,
    string Reason);
