namespace Pelihuone.Contracts.Games;

public sealed record WishGameRequest(
    string Name,
    string Platform,
    string Description);
