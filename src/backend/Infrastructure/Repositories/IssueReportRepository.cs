using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Repositories;

/// <summary>
/// EF Core -pohjainen toteutus <see cref="IIssueReportRepository"/>-rajapinnalle vikailmoitusten
/// hakemiseen, tallentamiseen ja tilan päivittämiseen.
/// </summary>
public sealed class IssueReportRepository : IIssueReportRepository
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// Alustaa uuden <see cref="IssueReportRepository"/>-instanssin annetulla tietokantakontekstilla.
    /// </summary>
    /// <param name="context">Sovelluksen tietokantakonteksti.</param>
    public IssueReportRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Hakee yksittäisen vikailmoituksen sen tunnisteen perusteella.
    /// </summary>
    /// <param name="id">Haettavan vikailmoituksen tunniste.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Löytynyt <see cref="IssueReport"/>-entiteetti tai <c>null</c>, jos ilmoitusta ei löydy.</returns>
    public async Task<IssueReport?> GetByIdAsync(IssueReportId id, CancellationToken cancellationToken = default)
    {
        return await _context.IssueReports.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
    }

    /// <summary>
    /// Hakee kaikki vikailmoitukset luontiajan mukaan laskevassa järjestyksessä (uusimmat ensin).
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Vain luku -lista kaikista vikailmoituksista.</returns>
    public async Task<IReadOnlyList<IssueReport>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // Järjestetään vikailmoitukset uusimmasta vanhimpaan ilman muutosseurantaa
        return await _context.IssueReports
            .AsNoTracking()
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Lisää uuden vikailmoituksen tietokantakontekstiin tallennusta varten.
    /// </summary>
    /// <param name="report">Lisättävä <see cref="IssueReport"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Tehtävä, joka edustaa asynkronista lisäysoperaatiota.</returns>
    public async Task AddAsync(IssueReport report, CancellationToken cancellationToken = default)
    {
        await _context.IssueReports.AddAsync(report, cancellationToken);
    }

    /// <summary>
    /// Merkitsee vikailmoituksen päivitetyksi tietokantakontekstissa.
    /// </summary>
    /// <param name="report">Päivitettävä <see cref="IssueReport"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Valmis tehtävä.</returns>
    public Task UpdateAsync(IssueReport report, CancellationToken cancellationToken = default)
    {
        _context.IssueReports.Update(report);
        return Task.CompletedTask;
    }
}
