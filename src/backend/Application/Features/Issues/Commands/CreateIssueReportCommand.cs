using MediatR;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Issues;

namespace Pelihuone.Application.Features.Issues.Commands;

/// <summary>
/// Komento uuden vikailmoituksen tai palautteen luomiseen.
/// </summary>
/// <param name="Request">Vikailmoituksen tiedot.</param>
public sealed record CreateIssueReportCommand(CreateIssueReportRequest Request)
    : IRequest<Result<IssueReportResponse>>;

/// <summary>
/// Käsittelijä <see cref="CreateIssueReportCommand"/>-komennolle.
/// </summary>
public sealed class CreateIssueReportCommandHandler
    : IRequestHandler<CreateIssueReportCommand, Result<IssueReportResponse>>
{
    private readonly IIssueReportService _issueReportService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="CreateIssueReportCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="issueReportService">Vikailmoituspalvelu ilmoituksen tallentamiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin vikailmoitustilanteen muutoksen välittämiseen.</param>
    public CreateIssueReportCommandHandler(
        IIssueReportService issueReportService,
        IRealtimeNotifier realtimeNotifier)
    {
        _issueReportService = issueReportService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Luo uuden vikailmoituksen ja lähettää reaaliaikailmoituksen onnistuessaan.
    /// </summary>
    /// <param name="request">Vikailmoituksen luontikomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Luotu vikailmoitus tai virhetulos.</returns>
    public async Task<Result<IssueReportResponse>> Handle(
        CreateIssueReportCommand request,
        CancellationToken cancellationToken)
    {
        Result<IssueReportResponse> result = await _issueReportService.CreateIssueReportAsync(
            request.Request,
            cancellationToken);

        if (result.IsSuccess)
        {
            await _realtimeNotifier.NotifyIssueReportChangedAsync(cancellationToken);
        }

        return result;
    }
}
