using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Abstractions.Repositories;

/// <summary>
/// Tietovarastorajapinta pelipisteiden (PC:t ja konsolit) tietokantaoperaatioille.
/// </summary>
public interface IGamingStationRepository
{
    /// <summary>
    /// Hakee pelipisteen sen yksilöllisen tunnisteen perusteella.
    /// </summary>
    Task<GamingStation?> GetByIdAsync(GamingStationId id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki aktiiviset ja käytössä olevat pelipisteet.
    /// </summary>
    Task<IReadOnlyList<GamingStation>> GetAllActiveAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Lisää uuden pelipisteen tietovarastoon.
    /// </summary>
    Task AddAsync(GamingStation station, CancellationToken cancellationToken = default);

    /// <summary>
    /// Päivittää olemassa olevan pelipisteen tiedot tietovarastoon.
    /// </summary>
    Task UpdateAsync(GamingStation station, CancellationToken cancellationToken = default);
}
