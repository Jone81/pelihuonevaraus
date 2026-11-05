namespace Pelihuone.Contracts.GamingStations;

/// <summary>
/// Vastausmalli, joka kuvaa yksittäisen pelipisteen tiedot ja saatavuustilan.
/// </summary>
/// <param name="Id">Pelipisteen yksilöivä tunniste.</param>
/// <param name="Name">Pelipisteen näyttönimi.</param>
/// <param name="Type">Pelipisteen laitetyyppi merkkijonona.</param>
/// <param name="UsesSharedTv">Ilmaisee, käyttääkö pelipiste jaettua televisiota (SharedTV).</param>
/// <param name="IsActive">Ilmaisee, onko pelipiste käytettävissä varauksiin.</param>
public sealed record GamingStationResponse(
    Guid Id,
    string Name,
    string Type,
    bool UsesSharedTv,
    bool IsActive);
