namespace Pelihuone.Contracts.Reservations;

/// <summary>
/// Pyynnön tietomalli käynnissä olevan varauksen lopettamiseksi kesken.
/// </summary>
/// <param name="UserId">Lopetusta pyytävän käyttäjän tunniste.</param>
public sealed record EndReservationRequest(Guid UserId);
