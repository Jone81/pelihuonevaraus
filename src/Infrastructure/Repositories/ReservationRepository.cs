using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Repositories;

/// <summary>
/// EF Core -pohjainen toteutus <see cref="IReservationRepository"/>-rajapinnalle varausten
/// hakemiseen, tallentamiseen sekä aikaväli- ja resurssikonfliktien tarkistamiseen.
/// </summary>
public sealed class ReservationRepository : IReservationRepository
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// Alustaa uuden <see cref="ReservationRepository"/>-instanssin annetulla tietokantakontekstilla.
    /// </summary>
    /// <param name="context">Sovelluksen tietokantakonteksti.</param>
    public ReservationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Hakee yksittäisen varauksen sen tunnisteen perusteella ja tyhjentää mahdolliset
    /// konstruktorissa syntyneet domain-tapahtumat.
    /// </summary>
    /// <param name="id">Haettavan varauksen tunniste.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Löytynyt <see cref="Reservation"/>-entiteetti tai <c>null</c>, jos varausta ei löydy.</returns>
    public async Task<Reservation?> GetByIdAsync(ReservationId id, CancellationToken cancellationToken = default)
    {
        var reservation = await _context.Reservations
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        // Tyhjennetään mahdolliset materialisoinnin yhteydessä syntyneet tapahtumat
        reservation?.ClearDomainEvents();
        return reservation;
    }

    /// <summary>
    /// Hakee kaikki aktiiviset varaukset, joiden aikaväli menee päällekkäin annetun aikaikkunan kanssa.
    /// </summary>
    /// <param name="window">Tarkasteltava aikaikkuna.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Vain luku -lista aikaikkunaan osuvista aktiivisista varauksista.</returns>
    public async Task<IReadOnlyList<Reservation>> GetActiveReservationsInWindowAsync(
        TimeWindow window,
        CancellationToken cancellationToken = default)
    {
        // Kaksi aikaväliä menee päällekkäin, kun A.Start < B.End ja A.End > B.Start
        return await _context.Reservations
            .AsNoTracking()
            .Where(r =>
                r.Status == ReservationStatus.Active &&
                r.TimeWindow.StartUtc < window.EndUtc &&
                r.TimeWindow.EndUtc > window.StartUtc)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Tarkistaa, onko tietyllä pelipisteellä (tai koko tilalla/tapahtumalla) päällekkäinen aktiivinen varaus
    /// annetussa aikaikkunassa.
    /// </summary>
    /// <param name="stationId">Tarkistettavan pelipisteen tunniste.</param>
    /// <param name="window">Varauksen toivottu aikaikkuna.</param>
    /// <param name="excludeReservationId">Valinnainen varauksen tunniste, joka jätetään huomioimatta (esim. muokattaessa olemassa olevaa varausta).</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns><c>true</c>, jos aikavälillä on esteenä oleva varaus; muuten <c>false</c>.</returns>
    public async Task<bool> HasConflictForStationAsync(
        GamingStationId stationId,
        TimeWindow window,
        ReservationId? excludeReservationId = null,
        CancellationToken cancellationToken = default)
    {
        // Tarkistetaan sekä kyseisen pelipisteen varaukset että koko tilan (Room/Event) sulkevat varaukset
        return await _context.Reservations
            .AsNoTracking()
            .AnyAsync(r =>
                r.Status == ReservationStatus.Active &&
                (!excludeReservationId.HasValue || r.Id != excludeReservationId.Value) &&
                r.TimeWindow.StartUtc < window.EndUtc &&
                r.TimeWindow.EndUtc > window.StartUtc &&
                (r.GamingStationId == stationId ||
                 r.Type == ReservationType.Room ||
                 r.Type == ReservationType.Event),
                cancellationToken);
    }

    /// <summary>
    /// Tarkistaa, onko jaettua televisiota käyttävien konsolien (PS5 ja Nintendo Switch) tai koko pelitilan
    /// osalta päällekkäistä aktiivista varausta annetussa aikaikkunassa.
    /// </summary>
    /// <param name="window">Varauksen toivottu aikaikkuna.</param>
    /// <param name="excludeReservationId">Valinnainen varauksen tunniste, joka jätetään huomioimatta.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns><c>true</c>, jos jaettu TV tai pelitila on jo varattu; muuten <c>false</c>.</returns>
    public async Task<bool> HasSharedTvConflictAsync(
        TimeWindow window,
        ReservationId? excludeReservationId = null,
        CancellationToken cancellationToken = default)
    {
        // Haetaan kaikkien jaettua televisiota käyttävien konsolipisteiden tunnisteet
        var sharedTvStationIds = await _context.GamingStations
            .AsNoTracking()
            .Where(s => s.Type == GamingStationType.PlayStation5 || s.Type == GamingStationType.NintendoSwitch)
            .Select(s => s.Id)
            .ToListAsync(cancellationToken);

        // Tarkistetaan, onko millään jaetun TV:n konsolilla tai koko tilalla päällekkäistä varausta
        return await _context.Reservations
            .AsNoTracking()
            .AnyAsync(r =>
                r.Status == ReservationStatus.Active &&
                (!excludeReservationId.HasValue || r.Id != excludeReservationId.Value) &&
                r.TimeWindow.StartUtc < window.EndUtc &&
                r.TimeWindow.EndUtc > window.StartUtc &&
                (r.Type == ReservationType.Room ||
                 r.Type == ReservationType.Event ||
                 (r.GamingStationId.HasValue && sharedTvStationIds.Contains(r.GamingStationId.Value))),
                cancellationToken);
    }

    /// <summary>
    /// Tarkistaa, estääkö mikään olemassa oleva aktiivinen varaus koko pelitilan tai tapahtuman
    /// varaamisen annetussa aikaikkunassa.
    /// </summary>
    /// <param name="window">Varauksen toivottu aikaikkuna.</param>
    /// <param name="excludeReservationId">Valinnainen varauksen tunniste, joka jätetään huomioimatta.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns><c>true</c>, jos aikaikkunassa on yksikin aktiivinen varaus; muuten <c>false</c>.</returns>
    public async Task<bool> HasRoomOrEventConflictAsync(
        TimeWindow window,
        ReservationId? excludeReservationId = null,
        CancellationToken cancellationToken = default)
    {
        // Koko huoneen tai tapahtuman varaus vaatii, ettei aikavälillä ole mitään muuta aktiivista varausta
        return await _context.Reservations
            .AsNoTracking()
            .AnyAsync(r =>
                r.Status == ReservationStatus.Active &&
                (!excludeReservationId.HasValue || r.Id != excludeReservationId.Value) &&
                r.TimeWindow.StartUtc < window.EndUtc &&
                r.TimeWindow.EndUtc > window.StartUtc,
                cancellationToken);
    }

    /// <summary>
    /// Lisää uuden varauksen tietokantakontekstiin tallennusta varten.
    /// </summary>
    /// <param name="reservation">Lisättävä <see cref="Reservation"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Tehtävä, joka edustaa asynkronista lisäysoperaatiota.</returns>
    public async Task AddAsync(Reservation reservation, CancellationToken cancellationToken = default)
    {
        await _context.Reservations.AddAsync(reservation, cancellationToken);
    }

    /// <summary>
    /// Merkitsee varauksen päivitetyksi tietokantakontekstissa.
    /// </summary>
    /// <param name="reservation">Päivitettävä <see cref="Reservation"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Valmis tehtävä.</returns>
    public Task UpdateAsync(Reservation reservation, CancellationToken cancellationToken = default)
    {
        _context.Reservations.Update(reservation);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Hakee kaikki tietokannassa olevat varaukset tilasta riippumatta.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Vain luku -lista kaikista varauksista.</returns>
    public async Task<IReadOnlyList<Reservation>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Reservations
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Hakee tietyn käyttäjän kaikki aktiiviset varaukset.
    /// </summary>
    /// <param name="userId">Käyttäjän tunniste, jonka varaukset haetaan.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Vain luku -lista käyttäjän aktiivisista varauksista.</returns>
    public async Task<IReadOnlyList<Reservation>> GetActiveReservationsForUserAsync(
        UserId userId,
        CancellationToken cancellationToken = default)
    {
        // Suodatetaan käyttäjätunnisteen ja aktiivisen tilan perusteella
        return await _context.Reservations
            .AsNoTracking()
            .Where(r => r.UserId == userId && r.Status == ReservationStatus.Active)
            .ToListAsync(cancellationToken);
    }
}
