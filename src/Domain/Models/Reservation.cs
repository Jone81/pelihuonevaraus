using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Events;
using Pelihuone.Domain.Exceptions;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

public sealed class Reservation : AggregateRoot<ReservationId>
{
    public UserId UserId { get; private set; }
    public ReservationType Type { get; private set; }
    public GamingStationId? GamingStationId { get; private set; }
    public GameRoomId? GameRoomId { get; private set; }
    public TimeWindow TimeWindow { get; private set; }
    public ReservationStatus Status { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public string? CancellationReason { get; private set; }
    public DateTimeOffset? CancelledAtUtc { get; private set; }

    public bool IsActive => Status == ReservationStatus.Active;

#pragma warning disable CS8618
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

        RaiseDomainEvent(new ReservationCreatedDomainEvent(
            Id,
            UserId,
            Type,
            GamingStationId,
            TimeWindow,
            CreatedAtUtc));
    }

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

    public static Reservation CreateEvent(
        ReservationId id,
        UserId creatorUserId,
        UserRole creatorRole,
        TimeWindow timeWindow,
        DateTimeOffset createdAtUtc,
        GameRoomId? gameRoomId = null)
    {
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
    public void Cancel(
        DateTimeOffset currentUtc,
        UserId requestedByUserId,
        UserRole requesterRole,
        string? reason = null)
    {
        if (Status == ReservationStatus.Cancelled)
        {
            throw new ReservationCancellationException("Varaus on jo peruttu.");
        }

        if (currentUtc >= TimeWindow.StartUtc)
        {
            throw new ReservationCancellationException("Varausta ei voi perua sen alkamisen jälkeen.");
        }

        bool isOwner = requestedByUserId == UserId;
        bool isStaff = requesterRole is UserRole.Admin or UserRole.SuperAdmin;

        if (!isOwner && !isStaff)
        {
            throw new ReservationCancellationException("Ei oikeutta perua toisen käyttäjän varausta.");
        }

        Status = ReservationStatus.Cancelled;
        CancellationReason = reason ?? "Käyttäjän tai ylläpidon peruuttama";
        CancelledAtUtc = currentUtc;

        RaiseDomainEvent(new ReservationCancelledDomainEvent(
            Id,
            requestedByUserId,
            CancellationReason,
            currentUtc));
    }

    /// <summary>
    /// Sääntö 8: SuperAdmin voi jyrätä muiden varaukset tapahtuman takia.
    /// </summary>
    public void OverrideAndCancelBySuperAdmin(
        DateTimeOffset currentUtc,
        UserId superAdminId,
        string reason)
    {
        if (Status == ReservationStatus.Cancelled)
        {
            return;
        }

        Status = ReservationStatus.Cancelled;
        CancellationReason = $"SuperAdmin jyräsi varauksen: {reason}";
        CancelledAtUtc = currentUtc;

        RaiseDomainEvent(new ReservationCancelledDomainEvent(
            Id,
            superAdminId,
            CancellationReason,
            currentUtc));
    }
}
