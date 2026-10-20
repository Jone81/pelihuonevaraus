using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Abstractions.Repositories;

public interface IIssueReportRepository
{
    Task<IssueReport?> GetByIdAsync(IssueReportId id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<IssueReport>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(IssueReport report, CancellationToken cancellationToken = default);
    Task UpdateAsync(IssueReport report, CancellationToken cancellationToken = default);
}
