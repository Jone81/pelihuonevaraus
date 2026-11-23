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

/// <summary>
/// Pyynnön tietomalli yksittäisen pelipisteen tilan (käytössä / huollossa) ja nimen päivittämiseen.
/// </summary>
/// <param name="IsActive">Asetetaanko pelipiste aktiiviseksi ja varattavaksi (<c>true</c>) vai huoltotilaan (<c>false</c>).</param>
/// <param name="Name">Valinnainen uusi näyttönimi pelipisteelle.</param>
public sealed record UpdateGamingStationStatusRequest(
    bool IsActive,
    string? Name = null);
