using FluentValidation;
using Microsoft.Extensions.Logging;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Application.Common;
using Pelihuone.Application.Notifications;
using Pelihuone.Contracts.Reservations;
using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Reservations;

public sealed class ReservationService : IReservationService
{
    private readonly IReservationRepository _reservationRepository;
    private readonly IGamingStationRepository _gamingStationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly IValidator<CreateReservationRequest> _createValidator;
    private readonly IValidator<CancelReservationRequest> _cancelValidator;
    private readonly ILogger<ReservationService> _logger;
    private readonly IDiscordNotificationService? _discordNotificationService;

    public ReservationService(
        IReservationRepository reservationRepository,
        IGamingStationRepository gamingStationRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IDateTimeProvider dateTimeProvider,
        IValidator<CreateReservationRequest> createValidator,
        IValidator<CancelReservationRequest> cancelValidator,
        ILogger<ReservationService> logger,
        IDiscordNotificationService? discordNotificationService = null)
    {
        _reservationRepository = reservationRepository;
        _gamingStationRepository = gamingStationRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _dateTimeProvider = dateTimeProvider;
        _createValidator = createValidator;
        _cancelValidator = cancelValidator;
        _logger = logger;
        _discordNotificationService = discordNotificationService;
    }

    public async Task<Result<ReservationResponse>> CreateReservationAsync(
        CreateReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await _createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            string errorMessage = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
            return Result.Failure<ReservationResponse>(Error.Validation("Reservation.ValidationFailed", errorMessage));
        }

        var userId = new UserId(request.UserId);
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result.Failure<ReservationResponse>(Error.NotFound("User.NotFound", "Käyttäjää ei löytynyt."));
        }

        DateTimeOffset nowUtc = _dateTimeProvider.UtcNow;
        TimeWindow timeWindow;

        try
        {
            timeWindow = TimeWindow.Create(
                request.StartUtc,
                request.EndUtc,
                (ReservationType)request.ReservationType,
                nowUtc,
                allowAnytime: user.IsSuperAdmin);
        }
        catch (DomainException ex)
        {
            return Result.Failure<ReservationResponse>(Error.Validation("Reservation.InvalidTime", ex.Message));
        }

        Reservation reservation;
        var reservationType = (ReservationType)request.ReservationType;

        // Sääntö: Opiskelijan tilavaraus saa kestää enintään 4 tuntia
        if (reservationType == ReservationType.Room && !user.IsAdmin && timeWindow.Duration > TimeSpan.FromHours(4))
        {
            return Result.Failure<ReservationResponse>(Error.Validation(
                "Reservation.RoomDurationExceeded",
                "Opiskelijan tilavarauksen enimmäiskesto on 4 tuntia. Pidemmät tilavaraukset ovat sallittuja vain henkilökunnalle/Admineille."));
        }

        // Sääntö: Päiväkohtainen enimmäisaika opiskelijalle (yhteensä max 4h / päivä)
        if (!user.IsAdmin)
        {
            var userReservations = await _reservationRepository.GetActiveReservationsForUserAsync(userId, cancellationToken);
            TimeZoneInfo tz = OpeningHours.FinnishTimeZone;
            DateTime targetDateLocal = TimeZoneInfo.ConvertTime(timeWindow.StartUtc, tz).Date;

            TimeSpan existingDailyDuration = TimeSpan.Zero;
            foreach (var r in userReservations)
            {
                DateTime existingDateLocal = TimeZoneInfo.ConvertTime(r.TimeWindow.StartUtc, tz).Date;
                if (existingDateLocal == targetDateLocal)
                {
                    existingDailyDuration += r.TimeWindow.Duration;
                }
            }

            if (existingDailyDuration + timeWindow.Duration > TimeSpan.FromHours(4))
            {
                return Result.Failure<ReservationResponse>(Error.Validation(
                    "Reservation.DailyLimitExceeded",
                    $"Päivittäinen varauskiintiö (enintään 4 tuntia / päivä) ylittyy. Sinulla on jo {existingDailyDuration.TotalMinutes} minuuttia aktiivisia varauksia kyseiselle päivälle."));
            }
        }

        if (reservationType == ReservationType.Individual)
        {
            var stationId = new GamingStationId(request.GamingStationId!.Value);
            var station = await _gamingStationRepository.GetByIdAsync(stationId, cancellationToken);
            if (station is null || !station.IsActive)
            {
                return Result.Failure<ReservationResponse>(Error.NotFound("GamingStation.NotFound", "Pelipistettä ei löytynyt tai se ei ole käytössä."));
            }

            // Sääntö 6: Jos laite käyttää SharedTV:tä (PS5 / Switch), kumpikaan ei saa olla varattuna
            if (station.UsesSharedTv)
            {
                bool sharedTvConflict = await _reservationRepository.HasSharedTvConflictAsync(timeWindow, null, cancellationToken);
                if (sharedTvConflict)
                {
                    return Result.Failure<ReservationResponse>(Error.Conflict("Reservation.SharedTvConflict", "Konsolien yhteinen näyttölaite (SharedTV) on jo varattu kyseiselle ajankohdalle."));
                }
            }

            // Sääntö 1 & 4: Ei päällekkäisiä varauksia samalle pelipisteelle tai koko tilan ollessa varattu
            bool conflict = await _reservationRepository.HasConflictForStationAsync(stationId, timeWindow, null, cancellationToken);
            if (conflict)
            {
                return Result.Failure<ReservationResponse>(Error.Conflict("Reservation.StationConflict", "Pelipiste on jo varattu valitulle aikavälille tai tilaan on tehty tilavaraus/tapahtuma."));
            }

            reservation = Reservation.CreateIndividual(
                ReservationId.New(),
                userId,
                stationId,
                timeWindow,
                nowUtc);
        }
        else if (reservationType == ReservationType.Room)
        {
            // Sääntö 4: Tilavarauksen aikana ei saa olla muita varauksia
            bool conflict = await _reservationRepository.HasRoomOrEventConflictAsync(timeWindow, null, cancellationToken);
            if (conflict)
            {
                return Result.Failure<ReservationResponse>(Error.Conflict("Reservation.RoomConflict", "Tilaan ei voi tehdä tilavarausta, koska ajankohdalle on jo olemassa varauksia."));
            }

            reservation = Reservation.CreateRoom(
                ReservationId.New(),
                userId,
                timeWindow,
                nowUtc);
        }
        else if (reservationType == ReservationType.Event)
        {
            if (!user.IsAdmin)
            {
                return Result.Failure<ReservationResponse>(Error.Forbidden("Reservation.Forbidden", "Vain ylläpitäjä voi luoda tapahtumavarauksia."));
            }

            bool conflict = await _reservationRepository.HasRoomOrEventConflictAsync(timeWindow, null, cancellationToken);
            if (conflict)
            {
                return Result.Failure<ReservationResponse>(Error.Conflict("Reservation.EventConflict", "Tapahtumalle on päällekkäisiä varauksia. Käytä SuperAdmin-jyräystä tarvittaessa."));
            }

            reservation = Reservation.CreateEvent(
                ReservationId.New(),
                userId,
                user.Role,
                timeWindow,
                nowUtc);
        }
        else
        {
            return Result.Failure<ReservationResponse>(Error.Validation("Reservation.InvalidType", "Tuntematon varaustyyppi."));
        }

        await _reservationRepository.AddAsync(reservation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (reservationType == ReservationType.Event && _discordNotificationService is not null)
        {
            _ = _discordNotificationService.SendEventNotificationAsync(
                "Pelihuoneen tapahtuma / turnaus",
                "Uusi tapahtuma luotu pelitilaan.",
                timeWindow.StartUtc,
                timeWindow.EndUtc,
                user.DisplayName,
                CancellationToken.None);
        }

        // GDPR: Lokitetaan vain tunnisteet, ei käyttäjän sähköpostia tai nimeä
        _logger.LogInformation("Varaus {ReservationId} luotu onnistuneesti käyttäjälle {UserId}.", reservation.Id.Value, userId.Value);

        return Result.Success(MapToResponse(reservation, user));
    }

    public async Task<Result<ReservationResponse>> CancelReservationAsync(
        Guid reservationId,
        CancelReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await _cancelValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            string errorMessage = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
            return Result.Failure<ReservationResponse>(Error.Validation("Reservation.ValidationFailed", errorMessage));
        }

        var resId = new ReservationId(reservationId);
        var reservation = await _reservationRepository.GetByIdAsync(resId, cancellationToken);
        if (reservation is null)
        {
            return Result.Failure<ReservationResponse>(Error.NotFound("Reservation.NotFound", "Varausta ei löytynyt."));
        }

        var userId = new UserId(request.UserId);
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result.Failure<ReservationResponse>(Error.NotFound("User.NotFound", "Käyttäjää ei löytynyt."));
        }

        // Anti-IDOR käyttöoikeustarkistus: Vain varauksen omistaja tai ylläpitäjä voi perua
        if (reservation.UserId != userId && !user.IsAdmin)
        {
            return Result.Failure<ReservationResponse>(Error.Forbidden("Reservation.Forbidden", "Ei oikeutta perua toisen käyttäjän varausta."));
        }

        DateTimeOffset nowUtc = _dateTimeProvider.UtcNow;

        try
        {
            reservation.Cancel(nowUtc, userId, user.Role, request.Reason);
        }
        catch (DomainException ex)
        {
            return Result.Failure<ReservationResponse>(Error.Validation("Reservation.CancellationFailed", ex.Message));
        }

        await _reservationRepository.UpdateAsync(reservation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Varaus {ReservationId} peruttu käyttäjän {UserId} toimesta.", reservation.Id.Value, userId.Value);

        return Result.Success(MapToResponse(reservation, user));
    }

    public async Task<Result<ReservationResponse>> OverrideAndCreateEventAsync(
        CreateReservationRequest request,
        string overrideReason,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await _createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            string errorMessage = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
            return Result.Failure<ReservationResponse>(Error.Validation("Reservation.ValidationFailed", errorMessage));
        }

        var userId = new UserId(request.UserId);
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result.Failure<ReservationResponse>(Error.NotFound("User.NotFound", "Käyttäjää ei löytynyt."));
        }

        // Sääntö 8: Vain SuperAdmin voi jyrätä muiden varauksia
        if (!user.IsSuperAdmin)
        {
            return Result.Failure<ReservationResponse>(Error.Forbidden("Reservation.Forbidden", "Vain pääkäyttäjä (SuperAdmin) voi jyrätä varauksia tapahtuman tieltä."));
        }

        DateTimeOffset nowUtc = _dateTimeProvider.UtcNow;
        TimeWindow timeWindow;

        try
        {
            timeWindow = TimeWindow.Create(
                request.StartUtc,
                request.EndUtc,
                ReservationType.Event,
                nowUtc,
                allowAnytime: true);
        }
        catch (DomainException ex)
        {
            return Result.Failure<ReservationResponse>(Error.Validation("Reservation.InvalidTime", ex.Message));
        }

        // Haetaan kaikki aikavälille osuvat aktiiviset varaukset ja jyrätään ne
        var conflicts = await _reservationRepository.GetActiveReservationsInWindowAsync(timeWindow, cancellationToken);
        foreach (var conflict in conflicts)
        {
            conflict.OverrideAndCancelBySuperAdmin(nowUtc, userId, overrideReason);
            await _reservationRepository.UpdateAsync(conflict, cancellationToken);
        }

        var eventReservation = Reservation.CreateEvent(
            ReservationId.New(),
            userId,
            user.Role,
            timeWindow,
            nowUtc);

        await _reservationRepository.AddAsync(eventReservation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (_discordNotificationService is not null)
        {
            _ = _discordNotificationService.SendEventNotificationAsync(
                "SuperAdmin Tapahtuma",
                overrideReason,
                timeWindow.StartUtc,
                timeWindow.EndUtc,
                user.DisplayName,
                CancellationToken.None);
        }

        _logger.LogWarning("SuperAdmin {UserId} jyräsi {ConflictCount} varausta tapahtuman {ReservationId} tieltä.",
            userId.Value, conflicts.Count, eventReservation.Id.Value);

        return Result.Success(MapToResponse(eventReservation, user));
    }

    public async Task<Result<ReservationResponse>> GetByIdAsync(
        Guid reservationId,
        CancellationToken cancellationToken = default)
    {
        var reservation = await _reservationRepository.GetByIdAsync(new ReservationId(reservationId), cancellationToken);
        if (reservation is null)
        {
            return Result.Failure<ReservationResponse>(Error.NotFound("Reservation.NotFound", "Varausta ei löytynyt."));
        }

        var user = await _userRepository.GetByIdAsync(reservation.UserId, cancellationToken);
        return Result.Success(MapToResponse(reservation, user));
    }

    public async Task<Result<IReadOnlyList<ReservationResponse>>> GetActiveReservationsAsync(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        CancellationToken cancellationToken = default)
    {
        if (startUtc >= endUtc)
        {
            return Result.Failure<IReadOnlyList<ReservationResponse>>(
                Error.Validation("TimeWindow.Invalid", "Alkuajan on oltava ennen loppuaikaa."));
        }

        var window = TimeWindow.FromExact(startUtc, endUtc);
        var active = await _reservationRepository.GetActiveReservationsInWindowAsync(window, cancellationToken);

        var responses = new List<ReservationResponse>(active.Count);
        foreach (var r in active)
        {
            var user = await _userRepository.GetByIdAsync(r.UserId, cancellationToken);
            responses.Add(MapToResponse(r, user));
        }

        return Result.Success<IReadOnlyList<ReservationResponse>>(responses);
    }

    private static ReservationResponse MapToResponse(Reservation r, User? user = null)
    {
        return new ReservationResponse(
            r.Id.Value,
            r.UserId.Value,
            r.Type.ToString(),
            r.GamingStationId?.Value,
            r.TimeWindow.StartUtc,
            r.TimeWindow.EndUtc,
            r.TimeWindow.Duration.TotalMinutes,
            r.Status.ToString(),
            r.CreatedAtUtc,
            r.CancellationReason,
            user?.DisplayName,
            user?.Email.Value);
    }
}
