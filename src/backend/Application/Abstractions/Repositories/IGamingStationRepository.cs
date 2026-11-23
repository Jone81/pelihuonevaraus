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
    /// <param name="id">Haettavan pelipisteen tunniste.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Löytynyt <see cref="GamingStation"/>-entiteetti tai <c>null</c>.</returns>
    Task<GamingStation?> GetByIdAsync(GamingStationId id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki aktiiviset ja käytössä olevat pelipisteet.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Vain luku -lista aktiivisista pelipisteistä.</returns>
    Task<IReadOnlyList<GamingStation>> GetAllActiveAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki pelipisteet (sekä käytössä olevat että huoltotilaan asetetut) ylläpitonäkymää varten.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Vain luku -lista kaikista järjestelmän pelipisteistä.</returns>
    Task<IReadOnlyList<GamingStation>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Lisää uuden pelipisteen tietovarastoon.
    /// </summary>
    /// <param name="station">Lisättävä pelipiste.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Asynkroninen tehtävä.</returns>
    Task AddAsync(GamingStation station, CancellationToken cancellationToken = default);

    /// <summary>
    /// Päivittää olemassa olevan pelipisteen tiedot tietovarastoon.
    /// </summary>
    /// <param name="station">Päivitettävä pelipiste.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Asynkroninen tehtävä.</returns>
    Task UpdateAsync(GamingStation station, CancellationToken cancellationToken = default);
}
