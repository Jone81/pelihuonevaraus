using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Users;
using Pelihuone.Contracts.Users;
using Pelihuone.Domain.Enums;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api")
            .WithTags("Authentication & Users");

        // Perinteinen nopea kirjautuminen (tai taaksepäinyhteensopivuus)
        group.MapPost("/auth/login", async (
            [FromBody] LoginRequest request,
            IUserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var result = await userService.AuthenticateOrCreateUserAsync(
                request.Email,
                request.DisplayName ?? string.Empty,
                cancellationToken);

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
            var result = await userService.SendVerificationCodeAsync(request.Email, cancellationToken);
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
            IUserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
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
            var result = await userService.GetUserByIdAsync(id, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetUserById")
        .WithSummary("Hae käyttäjän profiilitiedot");

        // Käyttäjän roolin päivitys (Admin)
        group.MapPut("/users/{id:guid}/role", async (
            Guid id,
            [FromBody] UpdateUserRoleRequest request,
            IUserService userService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            if (!Enum.TryParse<UserRole>(request.Role, true, out var newRole))
            {
                return Results.BadRequest(new { error = "Tuntematon rooli. Sallitut: User, Admin, SuperAdmin." });
            }

            var result = await userService.UpdateUserRoleAsync(id, newRole, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("UpdateUserRole")
        .WithSummary("Päivitä käyttäjän järjestelmärooli (Admin)");

        return app;
    }
}

public sealed record LoginRequest(string Email, string? DisplayName = null);
