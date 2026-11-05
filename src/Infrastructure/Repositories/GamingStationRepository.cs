using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Repositories;

/// <summary>
/// EF Core -pohjainen toteutus <see cref="IGamingStationRepository"/>-rajapinnalle pelipisteiden
/// (PC:t ja konsolit) hakemiseen ja hallintaan.
/// </summary>
public sealed class GamingStationRepository : IGamingStationRepository
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// Alustaa uuden <see cref="GamingStationRepository"/>-instanssin annetulla tietokantakontekstilla.
    /// </summary>
    /// <param name="context">Sovelluksen tietokantakonteksti.</param>
    public GamingStationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Hakee yksittäisen pelipisteen sen tunnisteen perusteella.
    /// </summary>
    /// <param name="id">Haettavan pelipisteen tunniste.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Löytynyt <see cref="GamingStation"/>-entiteetti tai <c>null</c>, jos pelipistettä ei löydy.</returns>
    public async Task<GamingStation?> GetByIdAsync(GamingStationId id, CancellationToken cancellationToken = default)
    {
        return await _context.GamingStations
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    /// <summary>
    /// Hakee kaikki aktiiviset (varattavissa olevat) pelipisteet nimen mukaan järjestettynä.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Vain luku -lista aktiivisista pelipisteistä.</returns>
    public async Task<IReadOnlyList<GamingStation>> GetAllActiveAsync(CancellationToken cancellationToken = default)
    {
        // Haetaan vain käytössä olevat pelipisteet ilman muutosseurantaa
        return await _context.GamingStations
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Lisää uuden pelipisteen tietokantakontekstiin tallennusta varten.
    /// </summary>
    /// <param name="station">Lisättävä <see cref="GamingStation"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Tehtävä, joka edustaa asynkronista lisäysoperaatiota.</returns>
    public async Task AddAsync(GamingStation station, CancellationToken cancellationToken = default)
    {
        await _context.GamingStations.AddAsync(station, cancellationToken);
    }

    /// <summary>
    /// Merkitsee pelipisteen päivitetyksi tietokantakontekstissa.
    /// </summary>
    /// <param name="station">Päivitettävä <see cref="GamingStation"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Valmis tehtävä.</returns>
    public Task UpdateAsync(GamingStation station, CancellationToken cancellationToken = default)
    {
        _context.GamingStations.Update(station);
        return Task.CompletedTask;
    }
}
