using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Abstractions.Repositories;

/// <summary>
/// Tietovarastorajapinta varausten hakuun, tallennukseen ja päällekkäisyystarkistuksiin.
/// </summary>
public interface IReservationRepository
{
    /// <summary>
    /// Hakee varauksen sen yksilöllisen tunnisteen perusteella.
    /// </summary>
    Task<Reservation?> GetByIdAsync(ReservationId id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki annetulle aikaikkunalle osuvat aktiiviset varaukset.
    /// </summary>
    Task<IReadOnlyList<Reservation>> GetActiveReservationsInWindowAsync(TimeWindow window, CancellationToken cancellationToken = default);

    /// <summary>
    /// Tarkistaa, onko tietylle pelipisteelle tai koko tilalle päällekkäistä varausta annetussa aikaikkunassa.
    /// </summary>
    Task<bool> HasConflictForStationAsync(
        GamingStationId stationId,
        TimeWindow window,
        ReservationId? excludeReservationId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Tarkistaa, onko yhteistä näyttölaitetta (SharedTV) käyttävälle konsolille päällekkäistä varausta annetussa aikaikkunassa.
    /// </summary>
    Task<bool> HasSharedTvConflictAsync(
        TimeWindow window,
        ReservationId? excludeReservationId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Tarkistaa, estääkö olemassa oleva varaus koko tilan tai tapahtuman varaamisen annetussa aikaikkunassa.
    /// </summary>
    Task<bool> HasRoomOrEventConflictAsync(
        TimeWindow window,
        ReservationId? excludeReservationId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lisää uuden varauksen tietovarastoon.
    /// </summary>
    Task AddAsync(Reservation reservation, CancellationToken cancellationToken = default);

    /// <summary>
    /// Päivittää olemassa olevan varauksen tiedot tietovarastoon.
    /// </summary>
    Task UpdateAsync(Reservation reservation, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki järjestelmän varaukset (mukaan lukien perutut).
    /// </summary>
    Task<IReadOnlyList<Reservation>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee tietyn käyttäjän kaikki aktiiviset varaukset.
    /// </summary>
    Task<IReadOnlyList<Reservation>> GetActiveReservationsForUserAsync(
        UserId userId,
        CancellationToken cancellationToken = default);
}
