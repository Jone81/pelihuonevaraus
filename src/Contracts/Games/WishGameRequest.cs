namespace Pelihuone.Contracts.Games;

/// <summary>
/// Pyynnön tietomalli uuden pelitoiveen lähettämiseksi toivelistalle.
/// </summary>
/// <param name="Name">Toivotun pelin nimi.</param>
/// <param name="Platform">Pelialusta, jolle peliä toivotaan.</param>
/// <param name="Description">Perustelut tai lisätiedot pelitoiveelle.</param>
public sealed record WishGameRequest(
    string Name,
    string Platform,
    string Description);
