namespace Pelihuone.Domain.Enums;

/// <summary>
/// Määrittelee pelihuoneessa varattavissa olevan pelipisteen laitetyypin.
/// </summary>
public enum GamingStationType
{
    /// <summary>
    /// Pelitietokone (PC).
    /// </summary>
    PC = 1,

    /// <summary>
    /// PlayStation 5 -pelikonsoli (jakaa yhteisen television Nintendo Switchin kanssa).
    /// </summary>
    PlayStation5 = 2,

    /// <summary>
    /// Nintendo Switch -pelikonsoli (jakaa yhteisen television PlayStation 5:n kanssa).
    /// </summary>
    NintendoSwitch = 3
}
