using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

public sealed class Game : Entity<GameId>
{
    public string Name { get; private set; }
    public GamingPlatform Platform { get; private set; }
    public string Description { get; private set; }
    public bool IsWishlist { get; private set; }
    public int VotesCount { get; private set; }

#pragma warning disable CS8618
    private Game() : base(GameId.Empty)
    {
    }
#pragma warning restore CS8618

    private Game(
        GameId id,
        string name,
        GamingPlatform platform,
        string description,
        bool isWishlist,
        int votesCount)
        : base(id)
    {
        Name = name;
        Platform = platform;
        Description = description;
        IsWishlist = isWishlist;
        VotesCount = votesCount;
    }

    public static Game Create(
        GameId id,
        string name,
        GamingPlatform platform,
        string description = "",
        bool isWishlist = false,
        int votesCount = 0)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("Pelin nimi ei voi olla tyhjä.");
        }

        return new Game(id, name.Trim(), platform, description.Trim(), isWishlist, Math.Max(0, votesCount));
    }

    public void Upvote() => VotesCount++;
    public void MarkAsAvailable() => IsWishlist = false;
    public void MarkAsWishlist() => IsWishlist = true;

    public void UpdateDetails(string name, string description, GamingPlatform platform)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("Pelin nimi ei voi olla tyhjä.");
        }

        Name = name.Trim();
        Description = description.Trim();
        Platform = platform;
    }
}
