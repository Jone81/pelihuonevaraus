using MediatR;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Issues;

namespace Pelihuone.Application.Features.Issues.Queries;

/// <summary>
/// Kysely kaikkien vikailmoitusten hakemiseen ylläpitonäkymää varten.
/// </summary>
/// <param name="AdminUserId">Kyselyn tekevän ylläpitäjän tunniste.</param>
public sealed record GetIssueReportsQuery(Guid AdminUserId)
    : IRequest<Result<IReadOnlyList<IssueReportResponse>>>;

/// <summary>
/// Käsittelijä <see cref="GetIssueReportsQuery"/>-kyselylle.
/// </summary>
public sealed class GetIssueReportsQueryHandler
    : IRequestHandler<GetIssueReportsQuery, Result<IReadOnlyList<IssueReportResponse>>>
{
    private readonly IIssueReportService _issueReportService;

    /// <summary>
    /// Alustaa uuden <see cref="GetIssueReportsQueryHandler"/>-instanssin.
    /// </summary>
    /// <param name="issueReportService">Vikailmoituspalvelu ilmoitusten hakemiseen.</param>
    public GetIssueReportsQueryHandler(IIssueReportService issueReportService)
    {
        _issueReportService = issueReportService;
    }

    /// <summary>
    /// Hakee kaikki vikailmoitukset ylläpitäjän käyttöoikeustarkistuksella.
    /// </summary>
    /// <param name="request">Vikailmoituskysely.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Lista vikailmoituksista tai virhetulos.</returns>
    public Task<Result<IReadOnlyList<IssueReportResponse>>> Handle(
        GetIssueReportsQuery request,
        CancellationToken cancellationToken)
    {
        return _issueReportService.GetAllIssueReportsAsync(request.AdminUserId, cancellationToken);
    }
}
