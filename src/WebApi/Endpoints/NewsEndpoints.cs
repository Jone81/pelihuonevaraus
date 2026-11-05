using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.News;
using Pelihuone.Contracts.News;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

/// <summary>
/// Sisältää pelihuoneen uutisiin ja tiedotteisiin liittyvät HTTP-päätepisteet.
/// </summary>
public static class NewsEndpoints
{
    /// <summary>
    /// Rekisteröi tiedotteiden hakuun, julkaisuun ja poistamiseen liittyvät päätepisteet reititykseen.
    /// </summary>
    /// <param name="app">Sovelluksen päätepisteiden reititysrakentaja.</param>
    /// <returns>Päivitetty reititysrakentaja ketjutusta varten.</returns>
    public static IEndpointRouteBuilder MapNewsEndpoints(this IEndpointRouteBuilder app)
    {
        // Luodaan reittiryhmä uutisille ja tiedotteille
        var group = app.MapGroup("/api/news")
            .WithTags("News & Announcements");

        // Hae kaikki uutiset ja tiedotteet
        group.MapGet("/", async (
            INewsService newsService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Haetaan kaikki julkaistut uutiset ja tiedotteet aikajärjestyksessä
            var result = await newsService.GetAllNewsAsync(cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetAllNews")
        .WithSummary("Hae kaikki tiedotteet ja uutiset");

        // Julkaise uusi tiedote (Admin)
        group.MapPost("/", async (
            [FromHeader(Name = "X-User-Id")] Guid? headerUserId,
            [FromBody] CreateNewsRequest request,
            INewsService newsService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Käytetään otsikossa välitettyä käyttäjätunnistetta tai pyynnön tekijätunnistetta
            Guid userId = headerUserId ?? request.AuthorUserId;
            var result = await newsService.CreateNewsAsync(request, userId, cancellationToken);
            return result.ToHttpResult(httpContext, val => Results.Created($"/api/news/{val.Id}", val));
        })
        .WithName("CreateNews")
        .WithSummary("Julkaise uusi tiedote tai uutinen (Vain Admin)");

        // Poista tiedote (Admin)
        group.MapDelete("/{id:guid}", async (
            Guid id,
            [FromHeader(Name = "X-User-Id")] Guid? headerUserId,
            INewsService newsService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Poistetaan tiedote tunnisteen perusteella (vaatii Admin-oikeudet)
            Guid userId = headerUserId ?? Guid.Empty;
            var result = await newsService.DeleteNewsAsync(id, userId, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("DeleteNews")
        .WithSummary("Poista tiedote (Vain Admin)");

        return app;
    }
}
