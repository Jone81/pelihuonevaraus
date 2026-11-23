namespace Pelihuone.Contracts.Games;

/// <summary>
/// Vastausmalli, joka sisältää pelin tai pelitoiveen tiedot asiakassovellukselle.
/// </summary>
/// <param name="Id">Pelin yksilöivä tunniste.</param>
/// <param name="Name">Pelin nimi.</param>
/// <param name="Platform">Pelialustan nimi.</param>
/// <param name="Description">Pelin esittely tai perustelu.</param>
/// <param name="IsWishlist">Ilmaisee, onko kyseessä toivelistan peli.</param>
/// <param name="VotesCount">Pelitoiveen saamien äänten lukumäärä.</param>
public sealed record GameResponse(
    Guid Id,
    string Name,
    string Platform,
    string Description,
    bool IsWishlist,
    int VotesCount = 0);
