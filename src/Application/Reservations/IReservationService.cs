using Pelihuone.Application.Common;
using Pelihuone.Contracts.Reservations;

namespace Pelihuone.Application.Reservations;

/// <summary>
/// Sovelluspalvelurajapinta pelihuoneen varausten luomiseen, perumiseen ja hakemiseen.
/// </summary>
public interface IReservationService
{
    /// <summary>
    /// Luo uuden varauksen (yksittäis-, tila- tai tapahtumavaraus) ja tarkistaa liiketoimintasäännöt sekä päällekkäisyydet.
    /// </summary>
    Task<Result<ReservationResponse>> CreateReservationAsync(
        CreateReservationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Peruu olemassa olevan varauksen käyttäjän tai ylläpitäjän toimesta.
    /// </summary>
    Task<Result<ReservationResponse>> CancelReservationAsync(
        Guid reservationId,
        CancelReservationRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Jyrää (peruu) kaikki aikavälillä olevat varaukset ja luo uuden tapahtumavarauksen (vaatii SuperAdmin-oikeudet).
    /// </summary>
    Task<Result<ReservationResponse>> OverrideAndCreateEventAsync(
        CreateReservationRequest request,
        string overrideReason,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee yksittäisen varauksen sen tunnisteen perusteella.
    /// </summary>
    Task<Result<ReservationResponse>> GetByIdAsync(
        Guid reservationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki annetulle aikavälille osuvat aktiiviset varaukset.
    /// </summary>
    Task<Result<IReadOnlyList<ReservationResponse>>> GetActiveReservationsAsync(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        CancellationToken cancellationToken = default);
}
