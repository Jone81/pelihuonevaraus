using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Repositories;

/// <summary>
/// EF Core -pohjainen toteutus <see cref="INewsRepository"/>-rajapinnalle uutisten ja tiedotteiden
/// hakemiseen sekä ylläpitoon.
/// </summary>
public sealed class NewsRepository : INewsRepository
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// Alustaa uuden <see cref="NewsRepository"/>-instanssin annetulla tietokantakontekstilla.
    /// </summary>
    /// <param name="context">Sovelluksen tietokantakonteksti.</param>
    public NewsRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Hakee yksittäisen uutisen sen tunnisteen perusteella.
    /// </summary>
    /// <param name="id">Haettavan uutisen tunniste.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Löytynyt <see cref="News"/>-entiteetti tai <c>null</c>, jos uutista ei löydy.</returns>
    public async Task<News?> GetByIdAsync(NewsId id, CancellationToken cancellationToken = default)
    {
        return await _context.News.FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    /// <summary>
    /// Hakee kaikki uutiset siten, että kiinnitetyt (<c>IsPinned</c>) uutiset ovat ensin ja
    /// sen jälkeen uutiset on järjestetty luontiajan mukaan uusimmasta vanhimpaan.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Vain luku -lista kaikista uutisista.</returns>
    public async Task<IReadOnlyList<News>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // Kiinnitetyt tiedotteet näytetään aina listan kärjessä, muutoin uusin ensin
        return await _context.News
            .AsNoTracking()
            .OrderByDescending(n => n.IsPinned)
            .ThenByDescending(n => n.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Lisää uuden uutisen tietokantakontekstiin tallennusta varten.
    /// </summary>
    /// <param name="news">Lisättävä <see cref="News"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Tehtävä, joka edustaa asynkronista lisäysoperaatiota.</returns>
    public async Task AddAsync(News news, CancellationToken cancellationToken = default)
    {
        await _context.News.AddAsync(news, cancellationToken);
    }

    /// <summary>
    /// Merkitsee uutisen päivitetyksi tietokantakontekstissa.
    /// </summary>
    /// <param name="news">Päivitettävä <see cref="News"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Valmis tehtävä.</returns>
    public Task UpdateAsync(News news, CancellationToken cancellationToken = default)
    {
        _context.News.Update(news);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Merkitsee uutisen poistettavaksi tietokantakontekstista.
    /// </summary>
    /// <param name="news">Poistettava <see cref="News"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Valmis tehtävä.</returns>
    public Task DeleteAsync(News news, CancellationToken cancellationToken = default)
    {
        _context.News.Remove(news);
        return Task.CompletedTask;
    }
}
