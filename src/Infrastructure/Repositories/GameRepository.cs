using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Repositories;

public sealed class GameRepository : IGameRepository
{
    private readonly ApplicationDbContext _context;

    public GameRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Game?> GetByIdAsync(GameId id, CancellationToken cancellationToken = default)
    {
        return await _context.Games.FirstOrDefaultAsync(g => g.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Game>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Games
            .AsNoTracking()
            .OrderBy(g => g.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Game>> GetByPlatformAsync(GamingPlatform platform, CancellationToken cancellationToken = default)
    {
        return await _context.Games
            .AsNoTracking()
            .Where(g => g.Platform == platform && !g.IsWishlist)
            .OrderBy(g => g.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Game>> GetWishlistAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Games
            .AsNoTracking()
            .Where(g => g.IsWishlist)
            .OrderBy(g => g.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Game game, CancellationToken cancellationToken = default)
    {
        await _context.Games.AddAsync(game, cancellationToken);
    }

    public Task UpdateAsync(Game game, CancellationToken cancellationToken = default)
    {
        _context.Games.Update(game);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Game game, CancellationToken cancellationToken = default)
    {
        _context.Games.Remove(game);
        return Task.CompletedTask;
    }
}
