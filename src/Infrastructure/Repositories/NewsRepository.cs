using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Repositories;

public sealed class NewsRepository : INewsRepository
{
    private readonly ApplicationDbContext _context;

    public NewsRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<News?> GetByIdAsync(NewsId id, CancellationToken cancellationToken = default)
    {
        return await _context.News.FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<News>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.News
            .AsNoTracking()
            .OrderByDescending(n => n.IsPinned)
            .ThenByDescending(n => n.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(News news, CancellationToken cancellationToken = default)
    {
        await _context.News.AddAsync(news, cancellationToken);
    }

    public Task UpdateAsync(News news, CancellationToken cancellationToken = default)
    {
        _context.News.Update(news);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(News news, CancellationToken cancellationToken = default)
    {
        _context.News.Remove(news);
        return Task.CompletedTask;
    }
}
