using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Repositories;

public sealed class GameRoomRepository : IGameRoomRepository
{
    private readonly ApplicationDbContext _context;

    public GameRoomRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<GameRoom?> GetByIdAsync(GameRoomId id, CancellationToken cancellationToken = default)
    {
        return await _context.GameRooms
            .Include(r => r.Stations)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<GameRoom>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.GameRooms
            .Include(r => r.Stations)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(GameRoom room, CancellationToken cancellationToken = default)
    {
        await _context.GameRooms.AddAsync(room, cancellationToken);
    }

    public Task UpdateAsync(GameRoom room, CancellationToken cancellationToken = default)
    {
        _context.GameRooms.Update(room);
        return Task.CompletedTask;
    }
}
