using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Abstractions.Repositories;

/// <summary>
/// Tietovarastorajapinta vikailmoitusten ja palautteiden tietokantaoperaatioille.
/// </summary>
public interface IIssueReportRepository
{
    /// <summary>
    /// Hakee vikailmoituksen sen yksilöllisen tunnisteen perusteella.
    /// </summary>
    Task<IssueReport?> GetByIdAsync(IssueReportId id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki järjestelmään jätetyt vikailmoitukset.
    /// </summary>
    Task<IReadOnlyList<IssueReport>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Lisää uuden vikailmoituksen tietovarastoon.
    /// </summary>
    Task AddAsync(IssueReport report, CancellationToken cancellationToken = default);

    /// <summary>
    /// Päivittää olemassa olevan vikailmoituksen tiedot tietovarastoon.
    /// </summary>
    Task UpdateAsync(IssueReport report, CancellationToken cancellationToken = default);
}
