using Pelihuone.Domain.Common;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

public sealed class IssueReport : Entity<IssueReportId>
{
    public string ReporterEmail { get; private set; }
    public string ReporterName { get; private set; }
    public string Target { get; private set; }
    public string Title { get; private set; }
    public string Description { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public bool IsResolved { get; private set; }
    public DateTimeOffset? ResolvedAt { get; private set; }
    public string? AdminNotes { get; private set; }

#pragma warning disable CS8618
    private IssueReport() : base(IssueReportId.Empty)
    {
    }
#pragma warning restore CS8618

    private IssueReport(
        IssueReportId id,
        string reporterEmail,
        string reporterName,
        string target,
        string title,
        string description,
        DateTimeOffset createdAt)
        : base(id)
    {
        ReporterEmail = reporterEmail;
        ReporterName = reporterName;
        Target = target;
        Title = title;
        Description = description;
        CreatedAt = createdAt;
        IsResolved = false;
        ResolvedAt = null;
        AdminNotes = null;
    }

    public static IssueReport Create(
        IssueReportId id,
        string reporterEmail,
        string reporterName,
        string target,
        string title,
        string description,
        DateTimeOffset createdAt)
    {
        if (string.IsNullOrWhiteSpace(target))
        {
            throw new DomainException("Kohteen (esim. laite tai tila) määrittely on pakollinen.");
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new DomainException("Vikailmoituksen otsikko ei voi olla tyhjä.");
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new DomainException("Vikailmoituksen kuvaus ei voi olla tyhjä.");
        }

        return new IssueReport(
            id,
            reporterEmail.Trim(),
            reporterName.Trim(),
            target.Trim(),
            title.Trim(),
            description.Trim(),
            createdAt);
    }

    public void Resolve(string? adminNotes, DateTimeOffset resolvedAt)
    {
        IsResolved = true;
        ResolvedAt = resolvedAt;
        AdminNotes = string.IsNullOrWhiteSpace(adminNotes) ? null : adminNotes.Trim();
    }
}
