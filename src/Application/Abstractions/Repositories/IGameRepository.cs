using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Abstractions.Repositories;

public interface IGameRepository
{
    Task<Game?> GetByIdAsync(GameId id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Game>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Game>> GetByPlatformAsync(GamingPlatform platform, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Game>> GetWishlistAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Game game, CancellationToken cancellationToken = default);
    Task UpdateAsync(Game game, CancellationToken cancellationToken = default);
    Task DeleteAsync(Game game, CancellationToken cancellationToken = default);
}
