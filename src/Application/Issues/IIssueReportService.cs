using Pelihuone.Application.Common;
using Pelihuone.Contracts.Issues;

namespace Pelihuone.Application.Issues;

public interface IIssueReportService
{
    Task<Result<IssueReportResponse>> CreateIssueReportAsync(
        CreateIssueReportRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<IReadOnlyList<IssueReportResponse>>> GetAllIssueReportsAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default);

    Task<Result<IssueReportResponse>> ResolveIssueReportAsync(
        Guid issueId,
        ResolveIssueReportRequest request,
        Guid adminUserId,
        CancellationToken cancellationToken = default);
}
