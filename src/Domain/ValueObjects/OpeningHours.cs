namespace Pelihuone.Domain.ValueObjects;

public sealed record OpeningHours
{
    public static readonly TimeOnly DefaultOpenTime = new(8, 0);
    public static readonly TimeOnly DefaultCloseTime = new(18, 0);

    public static readonly TimeZoneInfo FinnishTimeZone = GetFinnishTimeZone();

    public TimeOnly OpenTime { get; init; } = DefaultOpenTime;
    public TimeOnly CloseTime { get; init; } = DefaultCloseTime;
    public bool OnlyWeekdays { get; init; } = false;

    public static OpeningHours WeekdayOpeningHours => new() { OnlyWeekdays = true };

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

        return startTime >= OpenTime && endTime <= CloseTime;
    }

    private static TimeZoneInfo GetFinnishTimeZone()
    {
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
