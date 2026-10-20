using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Issues;
using Pelihuone.Contracts.Issues;
using Pelihuone.WebApi.Extensions;

namespace Pelihuone.WebApi.Endpoints;

public static class IssueEndpoints
{
    public static IEndpointRouteBuilder MapIssueEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/issues")
            .WithTags("Issues & Bug Reports");

        // Lähetä vikailmoitus / virheilmoitus
        group.MapPost("/", async (
            [FromBody] CreateIssueReportRequest request,
            IIssueReportService issueReportService,
            HttpContext httpContext,
            CancellationToken cancellationToken) =>
        {
            var result = await issueReportService.CreateIssueReportAsync(request, cancellationToken);
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
            Guid adminId = headerUserId ?? Guid.Empty;
            var result = await issueReportService.GetAllIssueReportsAsync(adminId, cancellationToken);
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
            Guid adminId = headerUserId ?? Guid.Empty;
            var result = await issueReportService.ResolveIssueReportAsync(id, request, adminId, cancellationToken);
            return result.ToHttpResult(httpContext);
        })
        .WithName("ResolveIssueReport")
        .WithSummary("Merkitse vikailmoitus ratkaistuksi (Vain Admin)");

        return app;
    }
}
