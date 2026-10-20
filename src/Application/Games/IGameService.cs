using Pelihuone.Application.Common;
using Pelihuone.Contracts.Games;
using Pelihuone.Domain.Enums;

namespace Pelihuone.Application.Games;

public interface IGameService
{
    Task<Result<IReadOnlyList<GameResponse>>> GetAllGamesAsync(CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<GameResponse>>> GetGamesByPlatformAsync(GamingPlatform platform, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<GameResponse>>> GetWishlistAsync(CancellationToken cancellationToken = default);
    Task<Result<GameResponse>> AddWishlistGameAsync(WishGameRequest request, CancellationToken cancellationToken = default);
    Task<Result<GameResponse>> CreateGameAsync(CreateGameRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<Result<GameResponse>> ToggleWishlistStatusAsync(Guid gameId, Guid userId, CancellationToken cancellationToken = default);
    Task<Result<GameResponse>> UpvoteWishlistGameAsync(Guid gameId, CancellationToken cancellationToken = default);
}
