using MediatR;
using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Common;
using Pelihuone.Application.Features.Games.Commands;
using Pelihuone.Application.Features.Games.Queries;
using Pelihuone.Contracts.Games;
using Pelihuone.Domain.Enums;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

/// <summary>
/// Sisältää pelivalikoimaan ja opiskelijoiden pelitoivelistaan liittyvät HTTP-päätepisteet.
/// </summary>
public static class GameEndpoints
{
    /// <summary>
    /// Rekisteröi pelien ja toivelistan hallintaan liittyvät päätepisteet reititykseen.
    /// </summary>
    /// <param name="app">Sovelluksen päätepisteiden reititysrakentaja.</param>
    /// <returns>Päivitetty reititysrakentaja ketjutusta varten.</returns>
    public static IEndpointRouteBuilder MapGameEndpoints(this IEndpointRouteBuilder app)
    {
        // Ryhmitellään kaikki peleihin liittyvät päätepisteet /api/games -polun alle
        RouteGroupBuilder group = app.MapGroup("/api/games")
            .WithTags("Games & Wishlist");

        // Kaikki saatavilla olevat pelit
        group.MapGet("/", async (
            [FromQuery] string? platform,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Jos kyselyparametrina on annettu kelvollinen pelialusta, suodatetaan pelit sen mukaan
            GamingPlatform? parsedPlatform = null;
            if (!string.IsNullOrWhiteSpace(platform) && Enum.TryParse<GamingPlatform>(platform, true, out GamingPlatform platformValue))
            {
                parsedPlatform = platformValue;
            }

            Result<IReadOnlyList<GameResponse>> result = await sender.Send(
                new GetGamesQuery(parsedPlatform),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetGames")
        .WithSummary("Hae kaikki pelit tai suodata alustan mukaan (PC, PlayStation5, NintendoSwitch)");

        // Toivelista
        group.MapGet("/wishlist", async (
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Haetaan kaikki opiskelijoiden ehdottamat toivelistapelit äänimäärineen
            Result<IReadOnlyList<GameResponse>> result = await sender.Send(
                new GetWishlistGamesQuery(),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetWishlist")
        .WithSummary("Hae opiskelijoiden pelitoivelista");

        // Ehdota uutta peliä toivelistalle (Opiskelija)
        group.MapPost("/wishlist", async (
            [FromBody] WishGameRequest request,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Lisätään uusi pelitoive toivelistalle ja palautetaan 201 Created
            Result<GameResponse> result = await sender.Send(
                new SuggestWishlistGameCommand(request),
                cancellationToken);
            return result.ToHttpResult(httpContext, val => Results.Created($"/api/games/wishlist", val));
        })
        .WithName("AddWishlistGame")
        .WithSummary("Ehdota uutta peliä toivelistalle");

        // Lisää virallinen peli valikoimaan (Admin)
        group.MapPost("/", async (
            [FromHeader(Name = "X-User-Id")] Guid? headerUserId,
            [FromBody] CreateGameRequest request,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Poimitaan kutsujan tunniste otsikosta käyttöoikeustarkistusta varten
            Guid userId = headerUserId ?? Guid.Empty;
            Result<GameResponse> result = await sender.Send(
                new CreateGameCommand(request, userId),
                cancellationToken);
            return result.ToHttpResult(httpContext, val => Results.Created($"/api/games/{val.Id}", val));
        })
        .WithName("CreateGame")
        .WithSummary("Lisää uusi peli viralliseen valikoimaan (Vain Admin)");

        // Muuta toivelistatilaa / hyväksy peli (Admin)
        group.MapPut("/{id:guid}/toggle-wishlist", async (
            Guid id,
            [FromHeader(Name = "X-User-Id")] Guid? headerUserId,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Siirretään peli toivelistalta viralliseen valikoimaan tai päinvastoin (vaatii Admin-oikeudet)
            Guid userId = headerUserId ?? Guid.Empty;
            Result<GameResponse> result = await sender.Send(
                new ToggleWishlistCommand(id, userId),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("ToggleWishlistStatus")
        .WithSummary("Vaihda pelin toivelistatila tai hyväksy peli viralliseen valikoimaan (Vain Admin)");

        // Äänestä toivelistapeliä (+1)
        group.MapPost("/{id:guid}/vote", async (
            Guid id,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Kasvatetaan toivelistalla olevan pelin äänimäärää yhdellä
            Result<GameResponse> result = await sender.Send(
                new VoteGameCommand(id),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("VoteGame")
        .WithSummary("Äänestä toivelistalla olevaa peliä (+1)");

        return app;
    }
}
