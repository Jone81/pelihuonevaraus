using Pelihuone.Domain.ValueObjects;
using NewsEntity = Pelihuone.Domain.Models.News;

namespace Pelihuone.Application.Abstractions.Repositories;

/// <summary>
/// Tietovarastorajapinta uutisten ja tiedotteiden tietokantaoperaatioille.
/// </summary>
public interface INewsRepository
{
    /// <summary>
    /// Hakee uutisen sen yksilöllisen tunnisteen perusteella.
    /// </summary>
    Task<NewsEntity?> GetByIdAsync(NewsId id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki julkaistut uutiset ja tiedotteet.
    /// </summary>
    Task<IReadOnlyList<NewsEntity>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Lisää uuden uutisen tietovarastoon.
    /// </summary>
    Task AddAsync(NewsEntity news, CancellationToken cancellationToken = default);

    /// <summary>
    /// Päivittää olemassa olevan uutisen tiedot tietovarastoon.
    /// </summary>
    Task UpdateAsync(NewsEntity news, CancellationToken cancellationToken = default);

    /// <summary>
    /// Poistaa uutisen tietovarastosta.
    /// </summary>
    Task DeleteAsync(NewsEntity news, CancellationToken cancellationToken = default);
}
