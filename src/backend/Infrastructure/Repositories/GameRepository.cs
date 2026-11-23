using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Repositories;

/// <summary>
/// EF Core -pohjainen toteutus <see cref="IGameRepository"/>-rajapinnalle pelien ja
/// pelitoivelistan tietokantakyselyihin sekä ylläpitoon.
/// </summary>
public sealed class GameRepository : IGameRepository
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// Alustaa uuden <see cref="GameRepository"/>-instanssin annetulla tietokantakontekstilla.
    /// </summary>
    /// <param name="context">Sovelluksen tietokantakonteksti.</param>
    public GameRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Hakee yksittäisen pelin sen yksilöllisen tunnisteen perusteella.
    /// </summary>
    /// <param name="id">Haettavan pelin tunniste.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Löytynyt <see cref="Game"/>-entiteetti tai <c>null</c>, jos peliä ei löydy.</returns>
    public async Task<Game?> GetByIdAsync(GameId id, CancellationToken cancellationToken = default)
    {
        // Haetaan peli muutosseurannalla mahdollista päivitystä tai äänestystä varten
        return await _context.Games.FirstOrDefaultAsync(g => g.Id == id, cancellationToken);
    }

    /// <summary>
    /// Hakee kaikki tietokannassa olevat pelit (sekä asennetut että toivelistan pelit) nimen mukaan järjestettynä.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Vain luku -lista kaikista peleistä.</returns>
    public async Task<IReadOnlyList<Game>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // Käytetään AsNoTracking-kyselyä suorituskyvyn parantamiseksi pelkässä lukukäytössä
        return await _context.Games
            .AsNoTracking()
            .OrderBy(g => g.Name)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Hakee tietylle pelialustalle asennetut (ei toivelistalla olevat) pelit nimen mukaan järjestettynä.
    /// </summary>
    /// <param name="platform">Pelialusta, jonka pelit haetaan.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Vain luku -lista valitun alustan asennetuista peleistä.</returns>
    public async Task<IReadOnlyList<Game>> GetByPlatformAsync(GamingPlatform platform, CancellationToken cancellationToken = default)
    {
        // Suodatetaan alustan mukaan ja rajataan toivelistapelit pois
        return await _context.Games
            .AsNoTracking()
            .Where(g => g.Platform == platform && !g.IsWishlist)
            .OrderBy(g => g.Name)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Hakee kaikki opiskelijoiden toivelistalla olevat pelit nimen mukaan järjestettynä.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Vain luku -lista toivelistapeleistä.</returns>
    public async Task<IReadOnlyList<Game>> GetWishlistAsync(CancellationToken cancellationToken = default)
    {
        // Haetaan vain toivelistalle merkityt pelit ilman muutosseurantaa
        return await _context.Games
            .AsNoTracking()
            .Where(g => g.IsWishlist)
            .OrderBy(g => g.Name)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Lisää uuden pelin tietokantakontekstiin tallennusta varten.
    /// </summary>
    /// <param name="game">Lisättävä <see cref="Game"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Tehtävä, joka edustaa asynkronista lisäysoperaatiota.</returns>
    public async Task AddAsync(Game game, CancellationToken cancellationToken = default)
    {
        await _context.Games.AddAsync(game, cancellationToken);
    }

    /// <summary>
    /// Merkitsee olemassa olevan pelin päivitetyksi tietokantakontekstissa.
    /// </summary>
    /// <param name="game">Päivitettävä <see cref="Game"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Valmis tehtävä.</returns>
    public Task UpdateAsync(Game game, CancellationToken cancellationToken = default)
    {
        _context.Games.Update(game);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Merkitsee pelin poistettavaksi tietokantakontekstista.
    /// </summary>
    /// <param name="game">Poistettava <see cref="Game"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Valmis tehtävä.</returns>
    public Task DeleteAsync(Game game, CancellationToken cancellationToken = default)
    {
        _context.Games.Remove(game);
        return Task.CompletedTask;
    }
}
