using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Abstractions.Repositories;

/// <summary>
/// Tietovarastorajapinta pelivalikoiman ja toivelistapelien tietokantaoperaatioille.
/// </summary>
public interface IGameRepository
{
    /// <summary>
    /// Hakee yksittäisen pelin sen tunnisteen perusteella.
    /// </summary>
    Task<Game?> GetByIdAsync(GameId id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki järjestelmään tallennetut pelit.
    /// </summary>
    Task<IReadOnlyList<Game>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee pelit tietyn pelialustan perusteella.
    /// </summary>
    Task<IReadOnlyList<Game>> GetByPlatformAsync(GamingPlatform platform, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki toivelistalla olevat pelit.
    /// </summary>
    Task<IReadOnlyList<Game>> GetWishlistAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Lisää uuden pelin tietovarastoon.
    /// </summary>
    Task AddAsync(Game game, CancellationToken cancellationToken = default);

    /// <summary>
    /// Päivittää olemassa olevan pelin tiedot tietovarastoon.
    /// </summary>
    Task UpdateAsync(Game game, CancellationToken cancellationToken = default);

    /// <summary>
    /// Poistaa pelin tietovarastosta.
    /// </summary>
    Task DeleteAsync(Game game, CancellationToken cancellationToken = default);
}
