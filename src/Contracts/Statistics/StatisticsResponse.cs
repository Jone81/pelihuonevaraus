namespace Pelihuone.Contracts.Statistics;

/// <summary>
/// Tilastotietue yksittäisen pelipisteen käyttöasteesta ja varausmäärästä.
/// </summary>
/// <param name="StationId">Pelipisteen yksilöivä tunniste.</param>
/// <param name="StationName">Pelipisteen näyttönimi.</param>
/// <param name="StationType">Pelipisteen laitetyyppi.</param>
/// <param name="ReservationCount">Pelipisteeseen kohdistuneiden aktiivisten varausten lukumäärä.</param>
/// <param name="TotalHours">Varattujen tuntien kokonaismäärä.</param>
public sealed record StationUsageStat(
    Guid StationId,
    string StationName,
    string StationType,
    int ReservationCount,
    double TotalHours);

/// <summary>
/// Tilastotietue varausten jakautumisesta eri varaustyyppeihin.
/// </summary>
/// <param name="ReservationType">Varaustyypin nimi.</param>
/// <param name="Count">Kyseisen varaustyypin varausten lukumäärä.</param>
public sealed record ReservationTypeStat(
    string ReservationType,
    int Count);

/// <summary>
/// Vastausmalli, joka kokoaa yhteen pelihuoneen käyttötilastot ylläpitoa varten.
/// </summary>
/// <param name="TotalReservations">Kaikkien tehtyjen varausten kokonaismäärä.</param>
/// <param name="ActiveReservations">Voimassa olevien varausten lukumäärä.</param>
/// <param name="CancelledReservations">Peruutettujen varausten lukumäärä.</param>
/// <param name="TotalUsers">Rekisteröityneiden käyttäjien kokonaismäärä.</param>
/// <param name="TotalGames">Pelikirjastossa saatavilla olevien pelien lukumäärä.</param>
/// <param name="WishlistGamesCount">Toivelistalla olevien pelitoiveiden lukumäärä.</param>
/// <param name="StationUsage">Pelipistekohtaiset käyttötilastot.</param>
/// <param name="TypeBreakdown">Varausten jakauma varaustyypeittäin.</param>
public sealed record StatisticsResponse(
    int TotalReservations,
    int ActiveReservations,
    int CancelledReservations,
    int TotalUsers,
    int TotalGames,
    int WishlistGamesCount,
    IReadOnlyList<StationUsageStat> StationUsage,
    IReadOnlyList<ReservationTypeStat> TypeBreakdown);
