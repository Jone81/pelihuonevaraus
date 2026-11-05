using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Events;
using Pelihuone.Domain.Exceptions;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

/// <summary>
/// Juurientiteetti (Aggregate Root), joka edustaa pelihuoneeseen tehtyä laite-, tila- tai tapahtumavarausta
/// ja valvoo varauksen elinkaareen liittyviä liiketoimintasääntöjä.
/// </summary>
public sealed class Reservation : AggregateRoot<ReservationId>
{
    /// <summary>
    /// Varauksen omistavan käyttäjän tunniste.
    /// </summary>
    public UserId UserId { get; private set; }

    /// <summary>
    /// Varauksen tyyppi (yksittäinen pelipiste, koko tila tai tapahtuma).
    /// </summary>
    public ReservationType Type { get; private set; }

    /// <summary>
    /// Varatun pelipisteen tunniste, jos kyseessä on yksittäisvaraus; muulloin <c>null</c>.
    /// </summary>
    public GamingStationId? GamingStationId { get; private set; }

    /// <summary>
    /// Varatun pelitilan tunniste, jos määritelty.
    /// </summary>
    public GameRoomId? GameRoomId { get; private set; }

    /// <summary>
    /// Varauksen alkamis- ja päättymisaikaa kuvaava aikaikkuna.
    /// </summary>
    public TimeWindow TimeWindow { get; private set; }

    /// <summary>
    /// Varauksen nykyinen tila (aktiivinen tai peruttu).
    /// </summary>
    public ReservationStatus Status { get; private set; }

    /// <summary>
    /// Varauksen luontihetken UTC-aikaleima.
    /// </summary>
    public DateTimeOffset CreatedAtUtc { get; private set; }

    /// <summary>
    /// Peruutuksen syy, mikäli varaus on peruttu.
    /// </summary>
    public string? CancellationReason { get; private set; }

    /// <summary>
    /// Peruutushetken UTC-aikaleima, mikäli varaus on peruttu.
    /// </summary>
    public DateTimeOffset? CancelledAtUtc { get; private set; }

    /// <summary>
    /// Ilmaisee, onko varaus edelleen voimassa (<see cref="ReservationStatus.Active"/>).
    /// </summary>
    public bool IsActive => Status == ReservationStatus.Active;

#pragma warning disable CS8618
    // EF Coren vaatima parametriton konstruktori.
    private Reservation() : base(ReservationId.Empty)
    {
    }
#pragma warning restore CS8618

    private Reservation(
        ReservationId id,
        UserId userId,
        ReservationType type,
        GamingStationId? gamingStationId,
        GameRoomId? gameRoomId,
        TimeWindow timeWindow,
        DateTimeOffset createdAtUtc)
        : base(id)
    {
        UserId = userId;
        Type = type;
        GamingStationId = gamingStationId;
        GameRoomId = gameRoomId;
        TimeWindow = timeWindow;
        Status = ReservationStatus.Active;
        CreatedAtUtc = createdAtUtc;

        // Nostetaan domain-tapahtuma uuden varauksen luonnista esimerkiksi ilmoituksia varten.
        RaiseDomainEvent(new ReservationCreatedDomainEvent(
            Id,
            UserId,
            Type,
            GamingStationId,
            TimeWindow,
            CreatedAtUtc));
    }

    /// <summary>
    /// Luo uuden yksittäisen pelipisteen varauksen.
    /// </summary>
    /// <param name="id">Varauksen yksilöivä tunniste.</param>
    /// <param name="userId">Varaajan käyttäjätunniste.</param>
    /// <param name="gamingStationId">Varattavan pelipisteen tunniste.</param>
    /// <param name="timeWindow">Validoitu varausaikaikkuna.</param>
    /// <param name="createdAtUtc">Luontihetken UTC-aikaleima.</param>
    /// <param name="gameRoomId">Valinnainen pelitilan tunniste.</param>
    /// <returns>Uusi aktiivinen yksittäisvaraus.</returns>
    public static Reservation CreateIndividual(
        ReservationId id,
        UserId userId,
        GamingStationId gamingStationId,
        TimeWindow timeWindow,
        DateTimeOffset createdAtUtc,
        GameRoomId? gameRoomId = null)
    {
        return new Reservation(
            id,
            userId,
            ReservationType.Individual,
            gamingStationId,
            gameRoomId,
            timeWindow,
            createdAtUtc);
    }

    /// <summary>
    /// Luo uuden koko pelihuoneen kattavan tilavarauksen.
    /// </summary>
    /// <param name="id">Varauksen yksilöivä tunniste.</param>
    /// <param name="userId">Varaajan käyttäjätunniste.</param>
    /// <param name="timeWindow">Validoitu varausaikaikkuna.</param>
    /// <param name="createdAtUtc">Luontihetken UTC-aikaleima.</param>
    /// <param name="gameRoomId">Valinnainen pelitilan tunniste.</param>
    /// <returns>Uusi aktiivinen tilavaraus.</returns>
    public static Reservation CreateRoom(
        ReservationId id,
        UserId userId,
        TimeWindow timeWindow,
        DateTimeOffset createdAtUtc,
        GameRoomId? gameRoomId = null)
    {
        return new Reservation(
            id,
            userId,
            ReservationType.Room,
            null,
            gameRoomId,
            timeWindow,
            createdAtUtc);
    }

    /// <summary>
    /// Luo uuden koko tilan kattavan tapahtumavarauksen ja tarkistaa, että luojalla on ylläpito-oikeudet.
    /// </summary>
    /// <param name="id">Varauksen yksilöivä tunniste.</param>
    /// <param name="creatorUserId">Varauksen luovan ylläpitäjän tunniste.</param>
    /// <param name="creatorRole">Varauksen luojan käyttäjärooli.</param>
    /// <param name="timeWindow">Validoitu varausaikaikkuna.</param>
    /// <param name="createdAtUtc">Luontihetken UTC-aikaleima.</param>
    /// <param name="gameRoomId">Valinnainen pelitilan tunniste.</param>
    /// <returns>Uusi aktiivinen tapahtumavaraus.</returns>
    public static Reservation CreateEvent(
        ReservationId id,
        UserId creatorUserId,
        UserRole creatorRole,
        TimeWindow timeWindow,
        DateTimeOffset createdAtUtc,
        GameRoomId? gameRoomId = null)
    {
        // Domain-sääntö: Tavallinen käyttäjä ei saa luoda tapahtumavarausta.
        if (creatorRole is not (UserRole.Admin or UserRole.SuperAdmin))
        {
            throw new DomainException("Vain ylläpitäjä (Admin) tai pääkäyttäjä (SuperAdmin) voi luoda tapahtumavarauksen.");
        }

        return new Reservation(
            id,
            creatorUserId,
            ReservationType.Event,
            null,
            gameRoomId,
            timeWindow,
            createdAtUtc);
    }

    /// <summary>
    /// Sääntö 5: Varauksen voi perua vain ennen sen alkamista (ei jälkikäteen).
    /// </summary>
    /// <param name="currentUtc">Peruutushetken UTC-aikaleima.</param>
    /// <param name="requestedByUserId">Peruutusta pyytävän käyttäjän tunniste.</param>
    /// <param name="requesterRole">Peruutusta pyytävän käyttäjän rooli.</param>
    /// <param name="reason">Valinnainen peruutuksen syy.</param>
    public void Cancel(
        DateTimeOffset currentUtc,
        UserId requestedByUserId,
        UserRole requesterRole,
        string? reason = null)
    {
        // Estetään jo kertaalleen perutun varauksen uudelleenperuutus.
        if (Status == ReservationStatus.Cancelled)
        {
            throw new ReservationCancellationException("Varaus on jo peruttu.");
        }

        // Sääntö 5: Kun varausaika on alkanut tai mennyt, varausta ei voi enää perua.
        if (currentUtc >= TimeWindow.StartUtc)
        {
            throw new ReservationCancellationException("Varausta ei voi perua sen alkamisen jälkeen.");
        }

        // Tarkistetaan käyttöoikeus: vain varauksen omistaja tai ylläpito saa perua varauksen.
        bool isOwner = requestedByUserId == UserId;
        bool isStaff = requesterRole is UserRole.Admin or UserRole.SuperAdmin;

        if (!isOwner && !isStaff)
        {
            throw new ReservationCancellationException("Ei oikeutta perua toisen käyttäjän varausta.");
        }

        Status = ReservationStatus.Cancelled;
        CancellationReason = reason ?? "Käyttäjän tai ylläpidon peruuttama";
        CancelledAtUtc = currentUtc;

        // Ilmoitetaan peruutuksesta domain-tapahtumalla.
        RaiseDomainEvent(new ReservationCancelledDomainEvent(
            Id,
            requestedByUserId,
            CancellationReason,
            currentUtc));
    }

    /// <summary>
    /// Sääntö 8: SuperAdmin voi jyrätä muiden varaukset tapahtuman takia.
    /// </summary>
    /// <param name="currentUtc">Jyräyshetken UTC-aikaleima.</param>
    /// <param name="superAdminId">Toimenpiteen suorittavan pääkäyttäjän tunniste.</param>
    /// <param name="reason">Perustelu sille, miksi varaus jyrättiin.</param>
    public void OverrideAndCancelBySuperAdmin(
        DateTimeOffset currentUtc,
        UserId superAdminId,
        string reason)
    {
        // Jos varaus on jo valmiiksi peruttu, mitään ei tarvitse tehdä.
        if (Status == ReservationStatus.Cancelled)
        {
            return;
        }

        Status = ReservationStatus.Cancelled;
        CancellationReason = $"SuperAdmin jyräsi varauksen: {reason}";
        CancelledAtUtc = currentUtc;

        // Nostetaan domain-tapahtuma pääkäyttäjän tekemästä pakkoperuutuksesta.
        RaiseDomainEvent(new ReservationCancelledDomainEvent(
            Id,
            superAdminId,
            CancellationReason,
            currentUtc));
    }
}
