using MediatR;
using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Common;
using Pelihuone.Application.Features.Reservations.Commands;
using Pelihuone.Application.Features.Reservations.Queries;
using Pelihuone.Contracts.Reservations;
using Pelihuone.WebApi.Abstractions;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

/// <summary>
/// Sisältää pelihuoneen ja pelipisteiden varauksiin liittyvät HTTP-päätepisteet.
/// </summary>
public static class ReservationEndpoints
{
    /// <summary>
    /// Rekisteröi varausten luomiseen, peruuttamiseen, jyräämiseen ja hakuun liittyvät päätepisteet.
    /// </summary>
    /// <param name="app">Sovelluksen päätepisteiden reititysrakentaja.</param>
    /// <returns>Päivitetty reititysrakentaja ketjutusta varten.</returns>
    public static IEndpointRouteBuilder MapReservationEndpoints(this IEndpointRouteBuilder app)
    {
        // Luodaan reittiryhmä varauksille
        RouteGroupBuilder group = app.MapGroup("/api/reservations")
            .WithTags("Reservations");

        // Luo uusi varaus (pelipiste, koko tila tai tapahtuma)
        group.MapPost("/", async (
            [FromBody] CreateReservationRequest request,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Luodaan varaus liiketoimintasääntöjen ja päällekkäisyystarkistusten mukaisesti
            Result<ReservationResponse> result = await sender.Send(
                new CreateReservationCommand(request),
                cancellationToken);
            return result.ToHttpResult(httpContext, response =>
                Results.Created($"/api/reservations/{response.Id}", response));
        })
        .RequireRateLimiting(RateLimitPolicies.Reservation)
        .WithName("CreateReservation")
        .WithSummary("Luo uusi varaus pelipisteelle, tilalle tai tapahtumalle");

        // Peruuta olemassa oleva varaus
        group.MapDelete("/{id:guid}", async (
            Guid id,
            [FromBody] CancelReservationRequest request,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Peruutetaan varaus, mikäli kutsujalla on oikeus ja varaus ei ole vielä alkanut
            Result<ReservationResponse> result = await sender.Send(
                new CancelReservationCommand(id, request),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .RequireRateLimiting(RateLimitPolicies.Reservation)
        .WithName("CancelReservation")
        .WithSummary("Peruuta voimassa oleva varaus ennen sen alkamisaikaa");

        // Lopeta parhaillaan käynnissä oleva aktiivinen varaus kesken
        group.MapPost("/{id:guid}/end", async (
            Guid id,
            [FromBody] EndReservationRequest request,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Lopetetaan käynnissä oleva varaus nykyhetkeen, jolloin laite vapautuu heti
            Result<ReservationResponse> result = await sender.Send(
                new EndReservationEarlyCommand(id, request),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .RequireRateLimiting(RateLimitPolicies.Reservation)
        .WithName("EndReservationEarly")
        .WithSummary("Lopeta parhaillaan käynnissä oleva varaus kesken ja vapauta pelipiste");

        // SuperAdmin-jyräys: peruuttaa ristiriitaiset varaukset ja luo tapahtumavarauksen
        group.MapPost("/override", async (
            [FromBody] OverrideReservationRequest request,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Jyrätään mahdolliset päällekkäiset opiskelijavaraukset ja luodaan tapahtuma
            Result<ReservationResponse> result = await sender.Send(
                new OverrideReservationCommand(request.ReservationRequest, request.Reason),
                cancellationToken);

            return result.ToHttpResult(httpContext, response =>
                Results.Created($"/api/reservations/{response.Id}", response));
        })
        .WithName("OverrideReservation")
        .WithSummary("SuperAdmin: Jyrää ristiriitaiset varaukset ja luo tapahtuma");

        // Hae yksittäinen varaus ID:n perusteella
        group.MapGet("/{id:guid}", async (
            Guid id,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Haetaan varauksen tarkemmat tiedot tunnisteella
            Result<ReservationResponse> result = await sender.Send(
                new GetReservationByIdQuery(id),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetReservationById")
        .WithSummary("Hae varauksen tiedot tunnisteella");

        // Hae aktiiviset varaukset annetulta aikaväliltä
        group.MapGet("/", async (
            [FromQuery] DateTimeOffset startUtc,
            [FromQuery] DateTimeOffset endUtc,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Haetaan kaikki voimassa olevat varaukset pyydetyltä UTC-aikaväliltä kalenterinäkymää varten
            Result<IReadOnlyList<ReservationResponse>> result = await sender.Send(
                new GetReservationsQuery(startUtc, endUtc),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetActiveReservations")
        .WithSummary("Hae aktiiviset varaukset aikaväliltä");

        return app;
    }
}

/// <summary>
/// Pyynnön tietomalli SuperAdmin-tapahtumavaraukselle, joka jyrää päällekkäiset varaukset.
/// </summary>
/// <param name="ReservationRequest">Luotavan tapahtumavarauksen tiedot.</param>
/// <param name="Reason">Perustelu, joka kirjataan peruutettavien varausten syyksi.</param>
public sealed record OverrideReservationRequest(
    CreateReservationRequest ReservationRequest,
    string Reason);
