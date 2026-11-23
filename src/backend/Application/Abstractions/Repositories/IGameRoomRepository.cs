using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Abstractions.Repositories;

/// <summary>
/// Tietovarastorajapinta pelihuoneiden tietokantaoperaatioille.
/// </summary>
public interface IGameRoomRepository
{
    /// <summary>
    /// Hakee pelihuoneen sen yksilöllisen tunnisteen perusteella.
    /// </summary>
    Task<GameRoom?> GetByIdAsync(GameRoomId id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki järjestelmään määritellyt pelihuoneet.
    /// </summary>
    Task<IReadOnlyList<GameRoom>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Lisää uuden pelihuoneen tietovarastoon.
    /// </summary>
    Task AddAsync(GameRoom room, CancellationToken cancellationToken = default);

    /// <summary>
    /// Päivittää olemassa olevan pelihuoneen tiedot tietovarastoon.
    /// </summary>
    Task UpdateAsync(GameRoom room, CancellationToken cancellationToken = default);
}
