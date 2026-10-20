namespace Pelihuone.Contracts.Games;

public sealed record CreateGameRequest(
    string Name,
    string Platform,
    string Description,
    bool IsWishlist = false);
