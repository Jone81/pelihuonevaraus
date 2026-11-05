using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Settings;
using Pelihuone.Application.Users;
using Pelihuone.Contracts.Settings;
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
        var group = app.MapGroup("/api/settings")
            .WithTags("Site Settings & Config");

        // Hae sivuston asetukset
        group.MapGet("/", async (
            ISettingsService settingsService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Haetaan nykyiset sivustoasetukset (aukioloajat, säännöt, ylläpitotila jne.)
            var result = await settingsService.GetSettingsAsync(cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetSettings")
        .WithSummary("Hae sivuston ja pelitilan asetukset (Admin)");

        // Päivitä sivuston asetukset (Admin / SuperAdmin)
        group.MapPut("/", async (
            [FromHeader(Name = "X-User-Id")] Guid? headerUserId,
            [FromBody] UpdateSiteSettingsRequest request,
            ISettingsService settingsService,
            IUserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Varmistetaan, että pyynnön tekijän käyttäjätunniste on annettu
            if (!headerUserId.HasValue)
            {
                return Results.Unauthorized();
            }

            // Tarkistetaan, että käyttäjällä on ylläpitäjän (Admin tai SuperAdmin) oikeudet
            var userResult = await userService.GetUserByIdAsync(headerUserId.Value, cancellationToken);
            if (!userResult.IsSuccess || (userResult.Value.Role != "Admin" && userResult.Value.Role != "SuperAdmin"))
            {
                return Results.Forbid();
            }

            // Tallennetaan päivitetyt sivustoasetukset
            var result = await settingsService.UpdateSettingsAsync(request, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("UpdateSettings")
        .WithSummary("Päivitä sivuston asetukset ml. Discord Webhook URL (Admin)");

        return app;
    }
}
