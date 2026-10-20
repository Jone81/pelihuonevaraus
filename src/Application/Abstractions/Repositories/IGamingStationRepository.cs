using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Abstractions.Repositories;

public interface IGamingStationRepository
{
    Task<GamingStation?> GetByIdAsync(GamingStationId id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<GamingStation>> GetAllActiveAsync(CancellationToken cancellationToken = default);

    Task AddAsync(GamingStation station, CancellationToken cancellationToken = default);

    Task UpdateAsync(GamingStation station, CancellationToken cancellationToken = default);
}
