using MediatR;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Issues;

namespace Pelihuone.Application.Features.Issues.Commands;

/// <summary>
/// Komento vikailmoituksen kuittaamiseen ratkaistuksi (ylläpitäjä).
/// </summary>
/// <param name="IssueId">Ratkaistavan vikailmoituksen tunniste.</param>
/// <param name="Request">Ratkaisun muistiinpanot ja tiedot.</param>
/// <param name="AdminUserId">Toiminnon suorittavan ylläpitäjän tunniste.</param>
public sealed record ResolveIssueReportCommand(
    Guid IssueId,
    ResolveIssueReportRequest Request,
    Guid AdminUserId) : IRequest<Result<IssueReportResponse>>;

/// <summary>
/// Käsittelijä <see cref="ResolveIssueReportCommand"/>-komennolle.
/// </summary>
public sealed class ResolveIssueReportCommandHandler
    : IRequestHandler<ResolveIssueReportCommand, Result<IssueReportResponse>>
{
    private readonly IIssueReportService _issueReportService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="ResolveIssueReportCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="issueReportService">Vikailmoituspalvelu ilmoituksen kuittaamiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin vikailmoitustilanteen muutoksen välittämiseen.</param>
    public ResolveIssueReportCommandHandler(
        IIssueReportService issueReportService,
        IRealtimeNotifier realtimeNotifier)
    {
        _issueReportService = issueReportService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Kuittaa vikailmoituksen ratkaistuksi ja lähettää reaaliaikailmoituksen onnistuessaan.
    /// </summary>
    /// <param name="request">Vikailmoituksen kuittauskomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Päivitetty vikailmoitus tai virhetulos.</returns>
    public async Task<Result<IssueReportResponse>> Handle(
        ResolveIssueReportCommand request,
        CancellationToken cancellationToken)
    {
        Result<IssueReportResponse> result = await _issueReportService.ResolveIssueReportAsync(
            request.IssueId,
            request.Request,
            request.AdminUserId,
            cancellationToken);

        if (result.IsSuccess)
        {
            await _realtimeNotifier.NotifyIssueReportChangedAsync(cancellationToken);
        }

        return result;
    }
}
