using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Repositories;

/// <summary>
/// EF Core -pohjainen toteutus <see cref="IGameRoomRepository"/>-rajapinnalle pelitilojen
/// ja niihin kuuluvien pelipisteiden hakemiseen ja ylläpitoon.
/// </summary>
public sealed class GameRoomRepository : IGameRoomRepository
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// Alustaa uuden <see cref="GameRoomRepository"/>-instanssin annetulla tietokantakontekstilla.
    /// </summary>
    /// <param name="context">Sovelluksen tietokantakonteksti.</param>
    public GameRoomRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Hakee pelitilan ja sen sisältämät pelipisteet tunnisteen perusteella.
    /// </summary>
    /// <param name="id">Haettavan pelitilan tunniste.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Löytynyt <see cref="GameRoom"/>-entiteetti tai <c>null</c>, jos pelitilaa ei löydy.</returns>
    public async Task<GameRoom?> GetByIdAsync(GameRoomId id, CancellationToken cancellationToken = default)
    {
        // Sisällytetään pelitilan pelipisteet (Include) mukaan kyselyyn
        return await _context.GameRooms
            .Include(r => r.Stations)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    /// <summary>
    /// Hakee kaikki pelitilat ja niiden pelipisteet tietokannasta.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Vain luku -lista kaikista pelitiloista.</returns>
    public async Task<IReadOnlyList<GameRoom>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // Haetaan pelitilat ja niiden pelipisteet ilman muutosseurantaa
        return await _context.GameRooms
            .Include(r => r.Stations)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Lisää uuden pelitilan tietokantakontekstiin tallennusta varten.
    /// </summary>
    /// <param name="room">Lisättävä <see cref="GameRoom"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Tehtävä, joka edustaa asynkronista lisäysoperaatiota.</returns>
    public async Task AddAsync(GameRoom room, CancellationToken cancellationToken = default)
    {
        await _context.GameRooms.AddAsync(room, cancellationToken);
    }

    /// <summary>
    /// Merkitsee pelitilan päivitetyksi tietokantakontekstissa.
    /// </summary>
    /// <param name="room">Päivitettävä <see cref="GameRoom"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Valmis tehtävä.</returns>
    public Task UpdateAsync(GameRoom room, CancellationToken cancellationToken = default)
    {
        _context.GameRooms.Update(room);
        return Task.CompletedTask;
    }
}
