using Pelihuone.Application.Common;
using Pelihuone.Contracts.Games;
using Pelihuone.Domain.Enums;

namespace Pelihuone.Application.Games;

/// <summary>
/// Sovelluspalvelurajapinta pelivalikoiman ja toivelistapelien hallintaan.
/// </summary>
public interface IGameService
{
    /// <summary>
    /// Hakee kaikki järjestelmässä olevat pelit.
    /// </summary>
    Task<Result<IReadOnlyList<GameResponse>>> GetAllGamesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee tietylle pelialustalle kuuluvat pelit.
    /// </summary>
    Task<Result<IReadOnlyList<GameResponse>>> GetGamesByPlatformAsync(GamingPlatform platform, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee opiskelijoiden toivomat toivelistapelit.
    /// </summary>
    Task<Result<IReadOnlyList<GameResponse>>> GetWishlistAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Lisää uuden pelitoiveen toivelistalle.
    /// </summary>
    Task<Result<GameResponse>> AddWishlistGameAsync(WishGameRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lisää uuden pelin pelivalikoimaan (vaatii ylläpitäjän oikeudet).
    /// </summary>
    Task<Result<GameResponse>> CreateGameAsync(CreateGameRequest request, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Vaihtaa pelin tilan toivelistan ja virallisen pelivalikoiman välillä (vaatii ylläpitäjän oikeudet).
    /// </summary>
    Task<Result<GameResponse>> ToggleWishlistStatusAsync(Guid gameId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lisää kannatusäänen toivelistalla olevalle pelille.
    /// </summary>
    Task<Result<GameResponse>> UpvoteWishlistGameAsync(Guid gameId, CancellationToken cancellationToken = default);
}
