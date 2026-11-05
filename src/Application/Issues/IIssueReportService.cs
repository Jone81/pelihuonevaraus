using Pelihuone.Application.Common;
using Pelihuone.Contracts.Issues;

namespace Pelihuone.Application.Issues;

/// <summary>
/// Sovelluspalvelurajapinta vikailmoitusten ja palautteiden hallintaan.
/// </summary>
public interface IIssueReportService
{
    /// <summary>
    /// Luo uuden vikailmoituksen ja lähettää siitä ilmoituksen ylläpidolle.
    /// </summary>
    Task<Result<IssueReportResponse>> CreateIssueReportAsync(
        CreateIssueReportRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki vikailmoitukset (vaatii ylläpitäjän oikeudet).
    /// </summary>
    Task<Result<IReadOnlyList<IssueReportResponse>>> GetAllIssueReportsAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Kuittaa vikailmoituksen ratkaistuksi ylläpitäjän muistiinpanoilla (vaatii ylläpitäjän oikeudet).
    /// </summary>
    Task<Result<IssueReportResponse>> ResolveIssueReportAsync(
        Guid issueId,
        ResolveIssueReportRequest request,
        Guid adminUserId,
        CancellationToken cancellationToken = default);
}
