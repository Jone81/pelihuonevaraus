using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Exceptions;

namespace Pelihuone.Domain.ValueObjects;

public sealed record TimeWindow
{
    public static readonly TimeSpan MinDuration = TimeSpan.FromMinutes(30);
    public static readonly TimeSpan MaxIndividualDuration = TimeSpan.FromHours(4);
    public static readonly TimeSpan MaxRoomDuration = TimeSpan.FromHours(10);
    public static readonly int MaxAdvanceBookingMonths = 2;

    public DateTimeOffset StartUtc { get; }
    public DateTimeOffset EndUtc { get; }

    public TimeSpan Duration => EndUtc - StartUtc;

#pragma warning disable CS8618
    private TimeWindow()
    {
    }
#pragma warning restore CS8618

    private TimeWindow(DateTimeOffset startUtc, DateTimeOffset endUtc)
    {
        StartUtc = startUtc;
        EndUtc = endUtc;
    }

    public static TimeWindow Create(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        ReservationType reservationType,
        DateTimeOffset currentUtc,
        OpeningHours? openingHours = null,
        TimeZoneInfo? timeZone = null,
        bool allowAnytime = false)
    {
        if (startUtc >= endUtc)
        {
            throw new InvalidReservationTimeException("Varauksen alkuajan on oltava ennen loppuaikaa.");
        }

        TimeSpan duration = endUtc - startUtc;
        if (duration < MinDuration)
        {
            throw new InvalidReservationTimeException($"Varauksen vähimmäiskesto on {MinDuration.TotalMinutes} minuuttia.");
        }

        if (!allowAnytime)
        {
            if (reservationType == ReservationType.Individual && duration > MaxIndividualDuration)
            {
                throw new InvalidReservationTimeException($"Yksittäisvarauksen enimmäiskesto on {MaxIndividualDuration.TotalHours} tuntia.");
            }

            if ((reservationType is ReservationType.Room or ReservationType.Event) && duration > MaxRoomDuration)
            {
                throw new InvalidReservationTimeException($"Tila- tai tapahtumavarauksen enimmäiskesto on {MaxRoomDuration.TotalHours} tuntia (1 päivä).");
            }

            if (startUtc < currentUtc.AddMinutes(-5))
            {
                throw new InvalidReservationTimeException("Varausta ei voi tehdä menneisyyteen.");
            }

            DateTimeOffset maxAllowedStart = currentUtc.AddMonths(MaxAdvanceBookingMonths);
            if (startUtc > maxAllowedStart)
            {
                throw new InvalidReservationTimeException($"Varauksen voi tehdä enintään {MaxAdvanceBookingMonths} kuukautta etukäteen.");
            }

            OpeningHours hours = openingHours ?? new OpeningHours();
            if (!hours.IsWithinOpeningHours(startUtc, endUtc, timeZone))
            {
                throw new InvalidReservationTimeException(
                    $"Varauksen on sijoituttava aukioloaikojen sisälle (ma-pe klo {hours.OpenTime:HH\\:mm} - {hours.CloseTime:HH\\:mm}).");
            }
        }

        return new TimeWindow(startUtc, endUtc);
    }

    public static TimeWindow FromExact(DateTimeOffset startUtc, DateTimeOffset endUtc)
    {
        if (startUtc >= endUtc)
        {
            throw new InvalidReservationTimeException("Varauksen alkuajan on oltava ennen loppuaikaa.");
        }

        return new TimeWindow(startUtc, endUtc);
    }

    public bool OverlapsWith(TimeWindow other) =>
        StartUtc < other.EndUtc && EndUtc > other.StartUtc;

    public bool Contains(DateTimeOffset timestampUtc) =>
        timestampUtc >= StartUtc && timestampUtc < EndUtc;
}
