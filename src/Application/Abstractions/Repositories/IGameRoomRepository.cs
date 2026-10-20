using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Abstractions.Repositories;

public interface IGameRoomRepository
{
    Task<GameRoom?> GetByIdAsync(GameRoomId id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<GameRoom>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(GameRoom room, CancellationToken cancellationToken = default);
    Task UpdateAsync(GameRoom room, CancellationToken cancellationToken = default);
}
