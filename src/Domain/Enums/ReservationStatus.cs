namespace Pelihuone.Domain.Enums;

/// <summary>
/// Kuvaa varauksen elinkaaren tilaa.
/// </summary>
public enum ReservationStatus
{
    /// <summary>
    /// Varaus on voimassa ja varaa valitun resurssin.
    /// </summary>
    Active = 1,

    /// <summary>
    /// Varaus on peruttu eikä se enää estä muita varauksia.
    /// </summary>
    Cancelled = 2
}
