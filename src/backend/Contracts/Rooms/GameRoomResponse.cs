namespace Pelihuone.Contracts.Rooms;

/// <summary>
/// Vastausmalli, joka kuvaa pelitilan perustiedot ja pelipisteiden lukumäärän.
/// </summary>
/// <param name="Id">Pelitilan yksilöivä tunniste.</param>
/// <param name="Name">Pelitilan nimi.</param>
/// <param name="HasSharedTv">Ilmaisee, onko pelitilassa konsolien jakama yhteinen televisio.</param>
/// <param name="StationCount">Pelitilassa olevien pelipisteiden kokonaismäärä.</param>
public sealed record GameRoomResponse(
    Guid Id,
    string Name,
    bool HasSharedTv,
    int StationCount);
