using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Repositories;

public sealed class IssueReportRepository : IIssueReportRepository
{
    private readonly ApplicationDbContext _context;

    public IssueReportRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IssueReport?> GetByIdAsync(IssueReportId id, CancellationToken cancellationToken = default)
    {
        return await _context.IssueReports.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<IssueReport>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.IssueReports
            .AsNoTracking()
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(IssueReport report, CancellationToken cancellationToken = default)
    {
        await _context.IssueReports.AddAsync(report, cancellationToken);
    }

    public Task UpdateAsync(IssueReport report, CancellationToken cancellationToken = default)
    {
        _context.IssueReports.Update(report);
        return Task.CompletedTask;
    }
}
