using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Games;
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
        var group = app.MapGroup("/api/games")
            .WithTags("Games & Wishlist");

        // Kaikki saatavilla olevat pelit
        group.MapGet("/", async (
            [FromQuery] string? platform,
            IGameService gameService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Jos kyselyparametrina on annettu kelvollinen pelialusta, suodatetaan pelit sen mukaan
            if (!string.IsNullOrWhiteSpace(platform) && Enum.TryParse<GamingPlatform>(platform, true, out var parsedPlatform))
            {
                var result = await gameService.GetGamesByPlatformAsync(parsedPlatform, cancellationToken);
                return result.ToHttpResult(httpContext);
            }

            // Muussa tapauksessa palautetaan kaikki virallisessa valikoimassa olevat pelit
            var allResult = await gameService.GetAllGamesAsync(cancellationToken);
            return allResult.ToHttpResult(httpContext);
        })
        .WithName("GetGames")
        .WithSummary("Hae kaikki pelit tai suodata alustan mukaan (PC, PlayStation5, NintendoSwitch)");

        // Toivelista
        group.MapGet("/wishlist", async (
            IGameService gameService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Haetaan kaikki opiskelijoiden ehdottamat toivelistapelit äänimäärineen
            var result = await gameService.GetWishlistAsync(cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetWishlist")
        .WithSummary("Hae opiskelijoiden pelitoivelista");

        // Ehdota uutta peliä toivelistalle (Opiskelija)
        group.MapPost("/wishlist", async (
            [FromBody] WishGameRequest request,
            IGameService gameService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Lisätään uusi pelitoive toivelistalle ja palautetaan 201 Created
            var result = await gameService.AddWishlistGameAsync(request, cancellationToken);
            return result.ToHttpResult(httpContext, val => Results.Created($"/api/games/wishlist", val));
        })
        .WithName("AddWishlistGame")
        .WithSummary("Ehdota uutta peliä toivelistalle");

        // Lisää virallinen peli valikoimaan (Admin)
        group.MapPost("/", async (
            [FromHeader(Name = "X-User-Id")] Guid? headerUserId,
            [FromBody] CreateGameRequest request,
            IGameService gameService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Poimitaan kutsujan tunniste otsikosta käyttöoikeustarkistusta varten
            Guid userId = headerUserId ?? Guid.Empty;
            var result = await gameService.CreateGameAsync(request, userId, cancellationToken);
            return result.ToHttpResult(httpContext, val => Results.Created($"/api/games/{val.Id}", val));
        })
        .WithName("CreateGame")
        .WithSummary("Lisää uusi peli viralliseen valikoimaan (Vain Admin)");

        // Muuta toivelistatilaa / hyväksy peli (Admin)
        group.MapPut("/{id:guid}/toggle-wishlist", async (
            Guid id,
            [FromHeader(Name = "X-User-Id")] Guid? headerUserId,
            IGameService gameService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Siirretään peli toivelistalta viralliseen valikoimaan tai päinvastoin (vaatii Admin-oikeudet)
            Guid userId = headerUserId ?? Guid.Empty;
            var result = await gameService.ToggleWishlistStatusAsync(id, userId, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("ToggleWishlistStatus")
        .WithSummary("Vaihda pelin toivelistatila tai hyväksy peli viralliseen valikoimaan (Vain Admin)");

        // Äänestä toivelistapeliä (+1)
        group.MapPost("/{id:guid}/vote", async (
            Guid id,
            IGameService gameService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Kasvatetaan toivelistalla olevan pelin äänimäärää yhdellä
            var result = await gameService.UpvoteWishlistGameAsync(id, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("VoteGame")
        .WithSummary("Äänestä toivelistalla olevaa peliä (+1)");

        return app;
    }
}
