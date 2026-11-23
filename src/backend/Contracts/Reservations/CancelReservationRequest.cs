namespace Pelihuone.Contracts.Reservations;

/// <summary>
/// Pyynnön tietomalli olemassa olevan varauksen peruuttamiseksi.
/// </summary>
/// <param name="UserId">Peruutusta pyytävän käyttäjän tunniste.</param>
/// <param name="Reason">Valinnainen peruutuksen syy.</param>
public sealed record CancelReservationRequest(
    Guid UserId,
    string? Reason);
