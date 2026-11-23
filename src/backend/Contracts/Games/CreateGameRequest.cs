namespace Pelihuone.Contracts.Games;

/// <summary>
/// Pyynnön tietomalli uuden pelin lisäämiseksi pelikirjastoon tai toivelistalle.
/// </summary>
/// <param name="Name">Pelin nimi.</param>
/// <param name="Platform">Pelialusta (esim. PC, PlayStation5 tai NintendoSwitch).</param>
/// <param name="Description">Pelin kuvaus tai lisätiedot.</param>
/// <param name="IsWishlist">Lisätäänkö peli toivelistalle (<c>true</c>) vai suoraan saataville (<c>false</c>).</param>
public sealed record CreateGameRequest(
    string Name,
    string Platform,
    string Description,
    bool IsWishlist = false);
