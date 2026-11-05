using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Users;
using Pelihuone.Contracts.Users;
using Pelihuone.Domain.Enums;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

/// <summary>
/// Sisältää autentikaatioon, kaksivaiheiseen sähköpostivarmistukseen (OTP) sekä käyttäjähallintaan liittyvät HTTP-päätepisteet.
/// </summary>
public static class AuthEndpoints
{
    /// <summary>
    /// Rekisteröi kirjautumis- ja käyttäjähallintapäätepisteet reititykseen.
    /// </summary>
    /// <param name="app">Sovelluksen päätepisteiden reititysrakentaja.</param>
    /// <returns>Päivitetty reititysrakentaja ketjutusta varten.</returns>
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        // Luodaan yhteinen reittiryhmä autentikoinnille ja käyttäjille
        var group = app.MapGroup("/api")
            .WithTags("Authentication & Users");

        // Perinteinen nopea kirjautuminen (tai taaksepäinyhteensopivuus)
        group.MapPost("/auth/login", async (
            [FromBody] LoginRequest request,
            IUserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Tunnistetaan olemassa oleva käyttäjä tai luodaan uusi oppilaitossähköpostin perusteella
            var result = await userService.AuthenticateOrCreateUserAsync(
                request.Email,
                request.DisplayName ?? string.Empty,
                cancellationToken);

            // Muunnetaan palvelukerroksen tulos RFC 9457 -yhteensopivaksi HTTP-vastaukseksi
            return result.ToHttpResult(httpContext);
        })
        .RequireRateLimiting("AuthPolicy")
        .WithName("Login")
        .WithSummary("Kirjaudu koulun sähköpostitunnuksilla (@edu.xamk.fi / @xamk.fi)");

        // 1. Lähetä 6-numeroinen vahvistuskoodi (OTP)
        group.MapPost("/auth/send-code", async (
            [FromBody] SendVerificationCodeRequest request,
            IUserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Generoidaan ja lähetetään kertakäyttöinen vahvistuskoodi käyttäjän sähköpostiin
            var result = await userService.SendVerificationCodeAsync(request.Email, cancellationToken);

            // Palautetaan onnistumisviesti sekä kehitysympäristöä varten generoitu koodi
            return result.ToHttpResult(httpContext, code =>
                Results.Ok(new { message = "Vahvistuskoodi lähetetty sähköpostiin.", devCode = code }));
        })
        .RequireRateLimiting("AuthPolicy")
        .WithName("SendVerificationCode")
        .WithSummary("Lähetä 6-numeroinen varmistuskoodi koulun sähköpostiin");

        // 2. Vahvista koodi ja kirjaudu
        group.MapPost("/auth/verify-code", async (
            [FromBody] VerifyCodeRequest request,
            IUserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Tarkistetaan vahvistuskoodin oikeellisuus ja voimassaolo sekä kirjataan käyttäjä sisään
            var result = await userService.VerifyCodeAndLoginAsync(
                request.Email,
                request.Code,
                request.DisplayName,
                cancellationToken);

            return result.ToHttpResult(httpContext);
        })
        .RequireRateLimiting("AuthPolicy")
        .WithName("VerifyCodeAndLogin")
        .WithSummary("Vahvista koodi ja kirjaudu sisään");

        // Kaikki käyttäjät (Admin)
        group.MapGet("/users", async (
            [FromHeader(Name = "X-User-Id")] Guid? headerUserId,
            IUserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Varmistetaan, että kutsujan käyttäjätunniste on mukana otsikkotiedoissa
            if (!headerUserId.HasValue)
            {
                return Results.Unauthorized();
            }

            // Tarkistetaan, että kutsujalla on ylläpitäjän (Admin tai SuperAdmin) oikeudet
            var userResult = await userService.GetUserByIdAsync(headerUserId.Value, cancellationToken);
            if (!userResult.IsSuccess || (userResult.Value.Role != "Admin" && userResult.Value.Role != "SuperAdmin"))
            {
                return Results.Forbid();
            }

            // Haetaan ja palautetaan kaikki järjestelmän käyttäjät
            var result = await userService.GetAllUsersAsync(cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetAllUsers")
        .WithSummary("Hae kaikki järjestelmän käyttäjät (Admin)");

        // Käyttäjän haku ID:llä
        group.MapGet("/users/{id:guid}", async (
            Guid id,
            IUserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Haetaan yksittäisen käyttäjän profiilitiedot tunnisteen perusteella
            var result = await userService.GetUserByIdAsync(id, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetUserById")
        .WithSummary("Hae käyttäjän profiilitiedot");

        // Käyttäjän roolin päivitys (SuperAdmin)
        group.MapPut("/users/{id:guid}/role", async (
            Guid id,
            [FromHeader(Name = "X-User-Id")] Guid? headerUserId,
            [FromBody] UpdateUserRoleRequest request,
            IUserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Varmistetaan, että pyynnön tekijä on tunnistautunut
            if (!headerUserId.HasValue)
            {
                return Results.Unauthorized();
            }

            // Vain SuperAdmin-roolissa oleva käyttäjä saa muuttaa muiden käyttäjien rooleja
            var authUserResult = await userService.GetUserByIdAsync(headerUserId.Value, cancellationToken);
            if (!authUserResult.IsSuccess || authUserResult.Value.Role != "SuperAdmin")
            {
                return Results.Forbid();
            }

            // Jäsennetään ja validoidaan pyydetty uusi käyttäjärooli
            if (!Enum.TryParse<UserRole>(request.Role, true, out var newRole))
            {
                return Results.BadRequest(new { error = "Tuntematon rooli. Sallitut: User, Admin, SuperAdmin." });
            }

            // Päivitetään kohdekäyttäjän rooli tietokantaan
            var result = await userService.UpdateUserRoleAsync(id, newRole, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("UpdateUserRole")
        .WithSummary("Päivitä käyttäjän järjestelmärooli (Admin)");

        return app;
    }
}

/// <summary>
/// Pyynnön tietomalli perinteiselle sähköpostipohjaiselle kirjautumiselle.
/// </summary>
/// <param name="Email">Käyttäjän oppilaitossähköpostiosoite (@edu.xamk.fi tai @xamk.fi).</param>
/// <param name="DisplayName">Valinnainen näyttönimi uutta käyttäjää luotaessa.</param>
public sealed record LoginRequest(string Email, string? DisplayName = null);
