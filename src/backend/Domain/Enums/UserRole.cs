namespace Pelihuone.Domain.Enums;

/// <summary>
/// Määrittelee käyttäjän käyttöoikeustason järjestelmässä.
/// </summary>
public enum UserRole
{
    /// <summary>
    /// Tavallinen opiskelija- tai henkilökuntakäyttäjä, joka voi tehdä ja hallita omia varauksiaan.
    /// </summary>
    User = 1,

    /// <summary>
    /// Ylläpitäjä, joka voi hallita sisältöä, laitteita, pelejä ja tapahtumavarauksia.
    /// </summary>
    Admin = 2,

    /// <summary>
    /// Pääkäyttäjä, jolla on täydet oikeudet mukaan lukien muiden varausten jyrääminen ja käyttäjäroolien hallinta.
    /// </summary>
    SuperAdmin = 3
}
