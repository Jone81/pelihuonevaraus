using MediatR;
using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Common;
using Pelihuone.Application.Features.Settings.Commands;
using Pelihuone.Application.Features.Settings.Queries;
using Pelihuone.Application.Features.Users.Queries;
using Pelihuone.Contracts.Settings;
using Pelihuone.Contracts.Users;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

/// <summary>
/// Sisältää sivuston ja pelihuoneen yleisiin asetuksiin liittyvät HTTP-päätepisteet.
/// </summary>
public static class SettingsEndpoints
{
    /// <summary>
    /// Rekisteröi sivuston asetusten hakuun ja muokkaamiseen käytettävät päätepisteet reititykseen.
    /// </summary>
    /// <param name="app">Sovelluksen päätepisteiden reititysrakentaja.</param>
    /// <returns>Päivitetty reititysrakentaja ketjutusta varten.</returns>
    public static IEndpointRouteBuilder MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        // Luodaan reittiryhmä järjestelmäasetuksille
        RouteGroupBuilder group = app.MapGroup("/api/settings")
            .WithTags("Site Settings & Config");

        // Hae sivuston asetukset
        group.MapGet("/", async (
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Haetaan nykyiset sivustoasetukset (aukioloajat, säännöt, ylläpitotila jne.)
            Result<SiteSettingsResponse> result = await sender.Send(
                new GetSiteSettingsQuery(),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetSettings")
        .WithSummary("Hae sivuston ja pelitilan asetukset (Admin)");

        // Päivitä sivuston asetukset (Admin / SuperAdmin)
        group.MapPut("/", async (
            [FromHeader(Name = "X-User-Id")] Guid? headerUserId,
            [FromBody] UpdateSiteSettingsRequest request,
            ISender sender,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Varmistetaan, että pyynnön tekijän käyttäjätunniste on annettu
            if (!headerUserId.HasValue)
            {
                return Results.Unauthorized();
            }

            // Tarkistetaan, että käyttäjällä on ylläpitäjän (Admin tai SuperAdmin) oikeudet
            Result<UserResponse> userResult = await sender.Send(
                new GetUserByIdQuery(headerUserId.Value),
                cancellationToken);
            if (!userResult.IsSuccess || (userResult.Value.Role != "Admin" && userResult.Value.Role != "SuperAdmin"))
            {
                return Results.StatusCode(StatusCodes.Status403Forbidden);
            }

            // Tallennetaan päivitetyt sivustoasetukset
            Result<SiteSettingsResponse> result = await sender.Send(
                new UpdateSiteSettingsCommand(request),
                cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("UpdateSettings")
        .WithSummary("Päivitä sivuston asetukset ml. Discord Webhook URL (Admin)");

        return app;
    }
}
