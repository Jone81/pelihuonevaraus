namespace Pelihuone.Contracts.Games;

public sealed record GameResponse(
    Guid Id,
    string Name,
    string Platform,
    string Description,
    bool IsWishlist,
    int VotesCount = 0);
