namespace Pelihuone.Contracts.Issues;

public sealed record CreateIssueReportRequest(
    string? ReporterEmail,
    string? ReporterName,
    string Target,
    string Title,
    string Description);

public sealed record IssueReportResponse(
    Guid Id,
    string ReporterEmail,
    string ReporterName,
    string Target,
    string Title,
    string Description,
    DateTimeOffset CreatedAt,
    bool IsResolved,
    DateTimeOffset? ResolvedAt,
    string? AdminNotes);

public sealed record ResolveIssueReportRequest(
    string? AdminNotes);
