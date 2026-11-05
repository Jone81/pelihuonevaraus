using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Common;
using Pelihuone.Application.Issues;
using Pelihuone.Contracts.Issues;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

/// <summary>
/// Sisältää vikailmoituksiin ja laitepalautteisiin liittyvät HTTP-päätepisteet.
/// </summary>
public static class IssueEndpoints
{
    /// <summary>
    /// Rekisteröi vikailmoitusten lähettämiseen, listaukseen ja ratkaisemiseen käytettävät päätepisteet.
    /// </summary>
    /// <param name="app">Sovelluksen päätepisteiden reititysrakentaja.</param>
    /// <returns>Päivitetty reititysrakentaja ketjutusta varten.</returns>
    public static IEndpointRouteBuilder MapIssueEndpoints(this IEndpointRouteBuilder app)
    {
        // Luodaan reittiryhmä vikailmoituksille
        RouteGroupBuilder group = app.MapGroup("/api/issues")
            .WithTags("Issues & Bug Reports");

        // Lähetä vikailmoitus / virheilmoitus
        group.MapPost("/", async (
            [FromBody] CreateIssueReportRequest request,
            IIssueReportService issueReportService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Tallennetaan uusi vikailmoitus ja välitetään siitä ilmoitus ylläpidon Discord-kanavalle
            Result<IssueReportResponse> result = await issueReportService.CreateIssueReportAsync(request, cancellationToken);
            return result.ToHttpResult(httpContext, val => Results.Created($"/api/issues/{val.Id}", val));
        })
        .WithName("CreateIssueReport")
        .WithSummary("Lähetä vikailmoitus tai palaute suoraan ylläpidolle");

        // Hae kaikki vikailmoitukset (Vain Admin)
        group.MapGet("/", async (
            [FromHeader(Name = "X-User-Id")] Guid? headerUserId,
            IIssueReportService issueReportService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Haetaan kaikki vikailmoitukset ylläpitäjän tarkasteltavaksi
            Guid adminId = headerUserId ?? Guid.Empty;
            Result<IReadOnlyList<IssueReportResponse>> result = await issueReportService.GetAllIssueReportsAsync(adminId, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("GetAllIssueReports")
        .WithSummary("Hae kaikki vikailmoitukset (Vain Admin)");

        // Merkitse vikailmoitus ratkaistuksi (Vain Admin)
        group.MapPut("/{id:guid}/resolve", async (
            Guid id,
            [FromHeader(Name = "X-User-Id")] Guid? headerUserId,
            [FromBody] ResolveIssueReportRequest request,
            IIssueReportService issueReportService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            // Merkitään vikailmoitus ratkaistuksi ja liitetään siihen ylläpitäjän muistiinpanot
            Guid adminId = headerUserId ?? Guid.Empty;
            Result<IssueReportResponse> result = await issueReportService.ResolveIssueReportAsync(id, request, adminId, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("ResolveIssueReport")
        .WithSummary("Merkitse vikailmoitus ratkaistuksi (Vain Admin)");

        return app;
    }
}
