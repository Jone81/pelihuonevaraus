using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Repositories;

public sealed class GamingStationRepository : IGamingStationRepository
{
    private readonly ApplicationDbContext _context;

    public GamingStationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<GamingStation?> GetByIdAsync(GamingStationId id, CancellationToken cancellationToken = default)
    {
        return await _context.GamingStations
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<GamingStation>> GetAllActiveAsync(CancellationToken cancellationToken = default)
    {
        return await _context.GamingStations
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(GamingStation station, CancellationToken cancellationToken = default)
    {
        await _context.GamingStations.AddAsync(station, cancellationToken);
    }

    public Task UpdateAsync(GamingStation station, CancellationToken cancellationToken = default)
    {
        _context.GamingStations.Update(station);
        return Task.CompletedTask;
    }
}
