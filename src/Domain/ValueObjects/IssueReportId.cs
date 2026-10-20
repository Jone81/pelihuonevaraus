namespace Pelihuone.Domain.ValueObjects;

public readonly record struct IssueReportId(Guid Value)
{
    public static IssueReportId New() => new(Guid.NewGuid());
    public static IssueReportId Empty => new(Guid.Empty);

    public override string ToString() => Value.ToString();
}
