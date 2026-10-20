using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Settings;
using Pelihuone.Contracts.Settings;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

public static class SettingsEndpoints
{
    public static IEndpointRouteBuilder MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/settings")
            .WithTags("Site Settings & Config");

        group.MapGet("/", async (
            ISettingsService settingsService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var result = await settingsService.GetSettingsAsync(cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetSettings")
        .WithSummary("Hae sivuston ja pelitilan asetukset (Admin)");

        group.MapPut("/", async (
            [FromBody] UpdateSiteSettingsRequest request,
            ISettingsService settingsService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var result = await settingsService.UpdateSettingsAsync(request, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("UpdateSettings")
        .WithSummary("Päivitä sivuston asetukset ml. Discord Webhook URL (Admin)");

        return app;
    }
}
