namespace Pelihuone.Domain.ValueObjects;

/// <summary>
/// Arvo-objekti, joka määrittelee pelihuoneen päivittäiset aukioloajat ja tarkistaa varausten sijoittumisen aukioloaikoihin.
/// </summary>
public sealed record OpeningHours
{
    /// <summary>
    /// Pelihuoneen oletusarvoinen avaamisaika (klo 08:00).
    /// </summary>
    public static readonly TimeOnly DefaultOpenTime = new(8, 0);

    /// <summary>
    /// Pelihuoneen oletusarvoinen sulkemisaika (klo 18:00).
    /// </summary>
    public static readonly TimeOnly DefaultCloseTime = new(18, 0);

    /// <summary>
    /// Suomen aikavyöhyke (FLE Standard Time / Europe/Helsinki), jota käytetään paikallisten aukioloaikojen laskentaan.
    /// </summary>
    public static readonly TimeZoneInfo FinnishTimeZone = GetFinnishTimeZone();

    /// <summary>
    /// Päivittäinen avaamisaika paikallisessa ajassa.
    /// </summary>
    public TimeOnly OpenTime { get; init; } = DefaultOpenTime;

    /// <summary>
    /// Päivittäinen sulkemisaika paikallisessa ajassa.
    /// </summary>
    public TimeOnly CloseTime { get; init; } = DefaultCloseTime;

    /// <summary>
    /// Ilmaisee, onko pelihuone avoinna vain arkisin (maanantaista perjantaihin).
    /// </summary>
    public bool OnlyWeekdays { get; init; } = true;

    /// <summary>
    /// Palauttaa oletusarvoiset arkipäivien aukioloajat (ma–pe klo 08:00–18:00).
    /// </summary>
    public static OpeningHours WeekdayOpeningHours => new() { OnlyWeekdays = true };

    /// <summary>
    /// Tarkistaa, sijoittuuko annettu UTC-aikaväli kokonaisuudessaan pelihuoneen paikallisten aukioloaikojen sisälle.
    /// </summary>
    /// <param name="startUtc">Varauksen alkamisaika UTC-ajassa.</param>
    /// <param name="endUtc">Varauksen päättymisaika UTC-ajassa.</param>
    /// <param name="timeZone">Käytettävä aikavyöhyke (oletuksena Suomen aikavyöhyke).</param>
    /// <returns><c>true</c>, jos aikaväli on sallittujen aukioloaikojen sisällä; muulloin <c>false</c>.</returns>
    public bool IsWithinOpeningHours(DateTimeOffset startUtc, DateTimeOffset endUtc, TimeZoneInfo? timeZone = null)
    {
        TimeZoneInfo tz = timeZone ?? FinnishTimeZone;
        DateTime startLocal = TimeZoneInfo.ConvertTime(startUtc, tz).DateTime;
        DateTime endLocal = TimeZoneInfo.ConvertTime(endUtc, tz).DateTime;

        // Varauksen täytyy alkaa ja päättyä samana paikallisena päivänä
        if (startLocal.Date != endLocal.Date)
        {
            return false;
        }

        // Tarkistetaan aukiolo viikonpäiville (Ma-Pe: auki klo 08:00–18:00)
        if (OnlyWeekdays && (startLocal.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday))
        {
            return false;
        }

        TimeOnly startTime = TimeOnly.FromDateTime(startLocal);
        TimeOnly endTime = TimeOnly.FromDateTime(endLocal);

        // Varmistetaan, että sekä alkamis- että päättymiskellonaika ovat aukiolorajojen sisällä.
        return startTime >= OpenTime && endTime <= CloseTime;
    }

    private static TimeZoneInfo GetFinnishTimeZone()
    {
        // Yritetään ensin Windowsin aikavyöhyketunnusta ja varavaihtoehtona IANA-tunnusta (Linux/macOS).
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("FLE Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Europe/Helsinki");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.Utc;
            }
        }
    }
}
