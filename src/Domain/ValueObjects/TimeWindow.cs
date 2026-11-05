using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Exceptions;

namespace Pelihuone.Domain.ValueObjects;

/// <summary>
/// Arvo-objekti, joka edustaa varauksen alkamis- ja päättymisaikaa sekä valvoo varausaikasääntöjä.
/// </summary>
public sealed record TimeWindow
{
    /// <summary>
    /// Sääntö 2: Varauksen vähimmäiskesto (30 minuuttia).
    /// </summary>
    public static readonly TimeSpan MinDuration = TimeSpan.FromMinutes(30);

    /// <summary>
    /// Sääntö 2: Yksittäisen pelipistevarauksen enimmäiskesto (4 tuntia).
    /// </summary>
    public static readonly TimeSpan MaxIndividualDuration = TimeSpan.FromHours(4);

    /// <summary>
    /// Sääntö 2: Koko tilan tai tapahtuman varauksen enimmäiskesto tavallisissa rajoissa (10 tuntia / 1 aukiolopäivä).
    /// </summary>
    public static readonly TimeSpan MaxRoomDuration = TimeSpan.FromHours(10);

    /// <summary>
    /// Sääntö 4: Kuinka monta kuukautta etukäteen varauksen voi enintään tehdä (2 kuukautta).
    /// </summary>
    public static readonly int MaxAdvanceBookingMonths = 2;

    /// <summary>
    /// Varauksen alkamisaika UTC-ajassa.
    /// </summary>
    public DateTimeOffset StartUtc { get; }

    /// <summary>
    /// Varauksen päättymisaika UTC-ajassa.
    /// </summary>
    public DateTimeOffset EndUtc { get; }

    /// <summary>
    /// Varauksen kokonaiskesto.
    /// </summary>
    public TimeSpan Duration => EndUtc - StartUtc;

#pragma warning disable CS8618
    // EF Coren vaatima parametriton konstruktori.
    private TimeWindow()
    {
    }
#pragma warning restore CS8618

    private TimeWindow(DateTimeOffset startUtc, DateTimeOffset endUtc)
    {
        StartUtc = startUtc;
        EndUtc = endUtc;
    }

    /// <summary>
    /// Luo ja validoi uuden varausaikaikkunan kaikkien kesto-, aukiolo- ja ennakkovaraussääntöjen mukaisesti.
    /// </summary>
    /// <param name="startUtc">Varauksen alkamisaika UTC-ajassa.</param>
    /// <param name="endUtc">Varauksen päättymisaika UTC-ajassa.</param>
    /// <param name="reservationType">Varauksen tyyppi enimmäiskeston tarkistusta varten.</param>
    /// <param name="currentUtc">Nykyhetken UTC-aika menneisyys- ja ennakkovaraustarkistuksia varten.</param>
    /// <param name="openingHours">Valinnaiset aukioloajat (oletuksena normaalit arkiaukioloajat).</param>
    /// <param name="timeZone">Valinnainen aikavyöhyke paikallisen aukioloajan tarkistukseen.</param>
    /// <param name="allowAnytime">Sallitaanko aukiolo- ja enimmäiskestorajojen ohittaminen (esim. ylläpidon erikoistapahtumat).</param>
    /// <returns>Validoitu <see cref="TimeWindow"/>-arvo-objekti.</returns>
    public static TimeWindow Create(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        ReservationType reservationType,
        DateTimeOffset currentUtc,
        OpeningHours? openingHours = null,
        TimeZoneInfo? timeZone = null,
        bool allowAnytime = false)
    {
        // Perustarkistus: lopetusajan on aina oltava aloitusajan jälkeen.
        if (startUtc >= endUtc)
        {
            throw new InvalidReservationTimeException("Varauksen alkuajan on oltava ennen loppuaikaa.");
        }

        // Sääntö 2: Kaikkien varausten on kestettävä vähintään 30 minuuttia.
        TimeSpan duration = endUtc - startUtc;
        if (duration < MinDuration)
        {
            throw new InvalidReservationTimeException($"Varauksen vähimmäiskesto on {MinDuration.TotalMinutes} minuuttia.");
        }

        // Tarkistetaan normaalit kesto-, menneisyys-, ennakkovaraus- ja aukiolorajoitukset, ellei niitä ole erikseen ohitettu.
        if (!allowAnytime)
        {
            // Sääntö 2: Yksittäisen pelipisteen varaus saa kestää enintään 4 tuntia.
            if (reservationType == ReservationType.Individual && duration > MaxIndividualDuration)
            {
                throw new InvalidReservationTimeException($"Yksittäisvarauksen enimmäiskesto on {MaxIndividualDuration.TotalHours} tuntia.");
            }

            // Sääntö 2: Tila- tai tapahtumavaraus saa kestää enintään 10 tuntia (yhden aukiolopäivän).
            if ((reservationType is ReservationType.Room or ReservationType.Event) && duration > MaxRoomDuration)
            {
                throw new InvalidReservationTimeException($"Tila- tai tapahtumavarauksen enimmäiskesto on {MaxRoomDuration.TotalHours} tuntia (1 päivä).");
            }

            // Sallitaan pieni 5 minuutin puskuri kellopoikkeamille, mutta estetään menneisyyteen varaaminen.
            if (startUtc < currentUtc.AddMinutes(-5))
            {
                throw new InvalidReservationTimeException("Varausta ei voi tehdä menneisyyteen.");
            }

            // Sääntö 4: Varausta ei voi tehdä yli 2 kuukautta etukäteen.
            DateTimeOffset maxAllowedStart = currentUtc.AddMonths(MaxAdvanceBookingMonths);
            if (startUtc > maxAllowedStart)
            {
                throw new InvalidReservationTimeException($"Varauksen voi tehdä enintään {MaxAdvanceBookingMonths} kuukautta etukäteen.");
            }

            // Sääntö 3: Varauksen on sijoituttava pelihuoneen aukioloaikoihin (ma–pe klo 08:00–18:00).
            OpeningHours hours = openingHours ?? new OpeningHours();
            if (!hours.IsWithinOpeningHours(startUtc, endUtc, timeZone))
            {
                throw new InvalidReservationTimeException(
                    $"Varauksen on sijoituttava aukioloaikojen sisälle (ma-pe klo {hours.OpenTime:HH\\:mm} - {hours.CloseTime:HH\\:mm}).");
            }
        }

        return new TimeWindow(startUtc, endUtc);
    }

    /// <summary>
    /// Luo aikaikkunan suoraan annetuista aikaleimoista tarkistaen vain, että alkuaika on ennen loppuaikaa.
    /// </summary>
    /// <param name="startUtc">Alkamisaika UTC-ajassa.</param>
    /// <param name="endUtc">Päättymisaika UTC-ajassa.</param>
    /// <returns>Uusi <see cref="TimeWindow"/>-arvo-objekti.</returns>
    public static TimeWindow FromExact(DateTimeOffset startUtc, DateTimeOffset endUtc)
    {
        if (startUtc >= endUtc)
        {
            throw new InvalidReservationTimeException("Varauksen alkuajan on oltava ennen loppuaikaa.");
        }

        return new TimeWindow(startUtc, endUtc);
    }

    /// <summary>
    /// Tarkistaa, meneekö tämä aikaikkuna päällekkäin toisen aikaikkunan kanssa.
    /// </summary>
    /// <param name="other">Vertailtava aikaikkuna.</param>
    /// <returns><c>true</c>, jos aikaikkunat leikkaavat toisensa; muulloin <c>false</c>.</returns>
    public bool OverlapsWith(TimeWindow other) =>
        StartUtc < other.EndUtc && EndUtc > other.StartUtc;

    /// <summary>
    /// Tarkistaa, sijoittuuko annettu aikaleima tämän aikaikkunan sisälle.
    /// </summary>
    /// <param name="timestampUtc">Tarkistettava UTC-aikaleima.</param>
    /// <returns><c>true</c>, jos aikaleima on aikaikkunan sisällä; muulloin <c>false</c>.</returns>
    public bool Contains(DateTimeOffset timestampUtc) =>
        timestampUtc >= StartUtc && timestampUtc < EndUtc;
}
