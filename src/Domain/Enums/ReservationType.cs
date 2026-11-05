namespace Pelihuone.Domain.Enums;

/// <summary>
/// Määrittelee varauksen laajuuden ja käyttötarkoituksen pelihuoneessa.
/// </summary>
public enum ReservationType
{
    /// <summary>
    /// Yksittäisen pelipisteen (esim. yhden PC:n tai konsolin) varaus.
    /// </summary>
    Individual = 1,

    /// <summary>
    /// Koko pelihuoneen varaus opiskelijakäyttöön.
    /// </summary>
    Room = 2,

    /// <summary>
    /// Ylläpitäjän tai pääkäyttäjän luoma koko tilan kattava tapahtumavaraus.
    /// </summary>
    Event = 3
}
