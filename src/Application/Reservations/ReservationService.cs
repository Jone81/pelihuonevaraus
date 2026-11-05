using FluentValidation;
using FluentValidation.Results;
using Microsoft.Extensions.Logging;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Application.Common;
using Pelihuone.Application.Notifications;
using Pelihuone.Application.Settings;
using Pelihuone.Contracts.Reservations;
using Pelihuone.Contracts.Settings;
using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Reservations;

/// <summary>
/// Toteuttaa pelihuoneen varausten luomisen, perumisen, SuperAdmin-jyräyksen ja hakujen liiketoimintalogiikan.
/// </summary>
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
    private readonly ISettingsService? _settingsService;

    /// <summary>
    /// Alustaa uuden <see cref="ReservationService"/>-instanssin.
    /// </summary>
    /// <param name="reservationRepository">Varausten tietovarasto.</param>
    /// <param name="gamingStationRepository">Pelipisteiden tietovarasto.</param>
    /// <param name="userRepository">Käyttäjien tietovarasto.</param>
    /// <param name="unitOfWork">Työyksikkö tietokantamuutosten tallentamiseen.</param>
    /// <param name="dateTimeProvider">Palvelimen kellonaika-abstraktio.</param>
    /// <param name="createValidator">Uuden varauksen syötevalidaattori.</param>
    /// <param name="cancelValidator">Peruutuspyynnön syötevalidaattori.</param>
    /// <param name="logger">Lokituspalvelu tapahtumien kirjaamiseen.</param>
    /// <param name="discordNotificationService">Valinnainen Discord-ilmoituspalvelu.</param>
    /// <param name="settingsService">Valinnainen sivustoasetuspalvelu dynaamisten kiintiöiden ja aukioloaikojen lukemiseen.</param>
    public ReservationService(
        IReservationRepository reservationRepository,
        IGamingStationRepository gamingStationRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IDateTimeProvider dateTimeProvider,
        IValidator<CreateReservationRequest> createValidator,
        IValidator<CancelReservationRequest> cancelValidator,
        ILogger<ReservationService> logger,
        IDiscordNotificationService? discordNotificationService = null,
        ISettingsService? settingsService = null)
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
        _settingsService = settingsService;
    }

    /// <summary>
    /// Luo uuden varauksen validoimalla pyynnön, aukioloajat, käyttäjän päiväkiintiön ja päällekkäisyydet.
    /// </summary>
    /// <param name="request">Uuden varauksen luontipyyntö.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Onnistunut tulos luodusta varauksesta tai virhekuvaus.</returns>
    public async Task<Result<ReservationResponse>> CreateReservationAsync(
        CreateReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validoidaan syötepyyntö FluentValidation-säännöillä
        ValidationResult validationResult = await _createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            string errorMessage = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
            return Result.Failure<ReservationResponse>(Error.Validation("Reservation.ValidationFailed", errorMessage));
        }

        // Varmistetaan, että varauksen tekevä käyttäjä on olemassa
        UserId userId = new UserId(request.UserId);
        User? user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result.Failure<ReservationResponse>(Error.NotFound("User.NotFound", "Käyttäjää ei löytynyt."));
        }

        // Tarkistetaan, onko käyttäjällä voimassa oleva käyttöesto (banni / porttikielto)
        DateTimeOffset currentUtc = _dateTimeProvider.UtcNow;
        if (user.IsBanned(currentUtc))
        {
            string untilText = user.BannedUntilUtc!.Value.Year >= currentUtc.Year + 50
                ? "toistaiseksi (pysyvä esto)"
                : user.BannedUntilUtc.Value.ToLocalTime().ToString("dd.MM.yyyy HH:mm", System.Globalization.CultureInfo.InvariantCulture);
            string reasonText = !string.IsNullOrWhiteSpace(user.BanReason)
                ? $" Syy: {user.BanReason}"
                : string.Empty;

            return Result.Failure<ReservationResponse>(
                Error.Forbidden(
                    "User.Banned",
                    $"Käyttäjätilisi on käyttöestossa ({untilText}), etkä voi tehdä uusia varauksia.{reasonText}"));
        }

        // Haetaan mahdolliset ylläpitäjän asettamat dynaamiset tilasäännöt ja kiintiöt
        int openHour = 8;
        int closeHour = 18;
        bool onlyWeekdays = true;
        int maxAdvanceMonths = 2;
        int maxIndividualHours = 4;
        int maxStudentRoomHours = 4;
        int minReservationMinutes = 30;
        bool enforceSharedTv = true;
        bool isMaintenanceMode = false;
        string maintenanceMessage = string.Empty;

        if (_settingsService is not null)
        {
            Result<SiteSettingsResponse>? settingsResult = await _settingsService.GetSettingsAsync(cancellationToken);
            if (settingsResult is not null && settingsResult.IsSuccess)
            {
                SiteSettingsResponse s = settingsResult.Value;
                openHour = s.OpenTimeHour;
                closeHour = s.CloseTimeHour;
                onlyWeekdays = s.OnlyWeekdays;
                maxAdvanceMonths = s.MaxAdvanceBookingMonths;
                maxIndividualHours = s.MaxIndividualHours;
                maxStudentRoomHours = s.MaxStudentRoomHours;
                minReservationMinutes = s.MinReservationMinutes;
                enforceSharedTv = s.EnforceSharedTvLock;
                isMaintenanceMode = s.IsMaintenanceMode;
                maintenanceMessage = s.MaintenanceMessage;
            }
        }

        // Tarkistetaan, onko pelitila asetettu tilapäiseen huoltotilaan (estää opiskelijavaraukset)
        if (isMaintenanceMode && !user.IsAdmin)
        {
            string msg = string.IsNullOrWhiteSpace(maintenanceMessage)
                ? "Pelihuone on tilapäisesti suljettu huollon vuoksi. Uusia varauksia ei voida tällä hetkellä tehdä."
                : $"Pelihuone on huoltotilassa: {maintenanceMessage}";
            return Result.Failure<ReservationResponse>(Error.Validation("Reservation.MaintenanceMode", msg));
        }

        OpeningHours configuredOpeningHours = new OpeningHours
        {
            OpenTime = new TimeOnly(openHour, 0),
            CloseTime = closeHour >= 24 ? new TimeOnly(23, 59) : new TimeOnly(closeHour, 0),
            OnlyWeekdays = onlyWeekdays
        };

        DateTimeOffset nowUtc = _dateTimeProvider.UtcNow;
        TimeWindow timeWindow;

        try
        {
            // Luodaan aikaikkuna, joka tarkistaa aukioloajat ja keston (SuperAdmin saa varata myös aukioloaikojen ulkopuolella)
            timeWindow = TimeWindow.Create(
                request.StartUtc,
                request.EndUtc,
                (ReservationType)request.ReservationType,
                nowUtc,
                openingHours: configuredOpeningHours,
                allowAnytime: user.IsSuperAdmin);
        }
        catch (DomainException ex)
        {
            return Result.Failure<ReservationResponse>(Error.Validation("Reservation.InvalidTime", ex.Message));
        }

        Reservation reservation;
        ReservationType reservationType = (ReservationType)request.ReservationType;

        if (!user.IsSuperAdmin)
        {
            // Tarkistetaan dynaaminen vähimmäiskesto
            if (timeWindow.Duration < TimeSpan.FromMinutes(minReservationMinutes))
            {
                return Result.Failure<ReservationResponse>(Error.Validation(
                    "Reservation.MinDurationNotMet",
                    $"Varauksen vähimmäiskesto on {minReservationMinutes} minuuttia."));
            }

            // Tarkistetaan dynaaminen ennakkovarausraja
            if (timeWindow.StartUtc > nowUtc.AddMonths(maxAdvanceMonths))
            {
                return Result.Failure<ReservationResponse>(Error.Validation(
                    "Reservation.AdvanceWindowExceeded",
                    $"Varauksen voi tehdä enintään {maxAdvanceMonths} kuukautta etukäteen."));
            }

            // Tarkistetaan dynaaminen yksittäisvarauksen enimmäiskesto
            if (reservationType == ReservationType.Individual && timeWindow.Duration > TimeSpan.FromHours(maxIndividualHours))
            {
                return Result.Failure<ReservationResponse>(Error.Validation(
                    "Reservation.IndividualDurationExceeded",
                    $"Yksittäisvarauksen enimmäiskesto on {maxIndividualHours} tuntia."));
            }
        }

        // Sääntö: Opiskelijan tilavaraus saa kestää enintään määritetyn tuntimäärän (oletus 4h)
        if (reservationType == ReservationType.Room && !user.IsAdmin && timeWindow.Duration > TimeSpan.FromHours(maxStudentRoomHours))
        {
            return Result.Failure<ReservationResponse>(Error.Validation(
                "Reservation.RoomDurationExceeded",
                $"Opiskelijan tilavarauksen enimmäiskesto on {maxStudentRoomHours} tuntia. Pidemmät tilavaraukset ovat sallittuja vain henkilökunnalle/Admineille."));
        }

        // Sääntö: Päiväkohtainen enimmäisaika opiskelijalle (yhteensä max N tuntia / päivä)
        if (!user.IsAdmin)
        {
            IReadOnlyList<Reservation> userReservations = await _reservationRepository.GetActiveReservationsForUserAsync(userId, cancellationToken);
            TimeZoneInfo tz = OpeningHours.FinnishTimeZone;
            DateTime targetDateLocal = TimeZoneInfo.ConvertTime(timeWindow.StartUtc, tz).Date;

            TimeSpan existingDailyDuration = TimeSpan.Zero;
            foreach (Reservation r in userReservations)
            {
                DateTime existingDateLocal = TimeZoneInfo.ConvertTime(r.TimeWindow.StartUtc, tz).Date;
                if (existingDateLocal == targetDateLocal)
                {
                    existingDailyDuration += r.TimeWindow.Duration;
                }
            }

            if (existingDailyDuration + timeWindow.Duration > TimeSpan.FromHours(maxIndividualHours))
            {
                return Result.Failure<ReservationResponse>(Error.Validation(
                    "Reservation.DailyLimitExceeded",
                    $"Päivittäinen varauskiintiö (enintään {maxIndividualHours} tuntia / päivä) ylittyy. Sinulla on jo {existingDailyDuration.TotalMinutes} minuuttia aktiivisia varauksia kyseiselle päivälle."));
            }
        }

        // Käsitellään yksittäisen pelipisteen varaus
        if (reservationType == ReservationType.Individual)
        {
            GamingStationId stationId = new GamingStationId(request.GamingStationId!.Value);
            GamingStation? station = await _gamingStationRepository.GetByIdAsync(stationId, cancellationToken);
            if (station is null || !station.IsActive)
            {
                return Result.Failure<ReservationResponse>(Error.NotFound("GamingStation.NotFound", "Pelipistettä ei löytynyt tai se on huoltotilassa."));
            }

            // Sääntö 6: Jos laite käyttää SharedTV:tä (PS5 / Switch) ja sääntö on päällä, kumpikaan ei saa olla varattuna
            if (enforceSharedTv && station.UsesSharedTv)
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
            // Vain ylläpitäjä saa luoda tapahtumavarauksia
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

        // Tallennetaan uusi varaus tietokantaan
        await _reservationRepository.AddAsync(reservation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Lähetetään taustalla Discord-ilmoitus, jos kyseessä on tapahtumavaraus
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

    /// <summary>
    /// Peruu olemassa olevan varauksen ja varmistaa käyttäjän oikeuden peruutukseen (Anti-IDOR).
    /// </summary>
    /// <param name="reservationId">Peruttavan varauksen tunniste.</param>
    /// <param name="request">Peruutuspyynnön tiedot.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Onnistunut tulos perutusta varauksesta tai virhekuvaus.</returns>
    public async Task<Result<ReservationResponse>> CancelReservationAsync(
        Guid reservationId,
        CancelReservationRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validoidaan peruutuspyyntö
        ValidationResult validationResult = await _cancelValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            string errorMessage = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
            return Result.Failure<ReservationResponse>(Error.Validation("Reservation.ValidationFailed", errorMessage));
        }

        // Haetaan peruttava varaus
        ReservationId resId = new ReservationId(reservationId);
        Reservation? reservation = await _reservationRepository.GetByIdAsync(resId, cancellationToken);
        if (reservation is null)
        {
            return Result.Failure<ReservationResponse>(Error.NotFound("Reservation.NotFound", "Varausta ei löytynyt."));
        }

        // Haetaan peruutusta pyytävä käyttäjä
        UserId userId = new UserId(request.UserId);
        User? user = await _userRepository.GetByIdAsync(userId, cancellationToken);
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
            // Suoritetaan toimialueen peruutuslogiikka (esim. peruutussääntö opiskelijoille)
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

    /// <summary>
    /// Jyrää kaikki aikavälillä olevat aktiiviset varaukset ja luo tilalle SuperAdmin-tapahtumavarauksen.
    /// </summary>
    /// <param name="request">Uuden tapahtumavarauksen luontipyyntö.</param>
    /// <param name="overrideReason">Perustelu sille, miksi olemassa olevat varaukset jyrätään.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Onnistunut tulos luodusta tapahtumavarauksesta tai virhekuvaus.</returns>
    public async Task<Result<ReservationResponse>> OverrideAndCreateEventAsync(
        CreateReservationRequest request,
        string overrideReason,
        CancellationToken cancellationToken = default)
    {
        // Validoidaan varauspyynnön perustiedot
        ValidationResult validationResult = await _createValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            string errorMessage = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
            return Result.Failure<ReservationResponse>(Error.Validation("Reservation.ValidationFailed", errorMessage));
        }

        UserId userId = new UserId(request.UserId);
        User? user = await _userRepository.GetByIdAsync(userId, cancellationToken);
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
            // SuperAdmin voi luoda tapahtuman mille tahansa kellonajalle (allowAnytime: true)
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
        IReadOnlyList<Reservation> conflicts = await _reservationRepository.GetActiveReservationsInWindowAsync(timeWindow, cancellationToken);
        foreach (Reservation conflict in conflicts)
        {
            conflict.OverrideAndCancelBySuperAdmin(nowUtc, userId, overrideReason);
            await _reservationRepository.UpdateAsync(conflict, cancellationToken);
        }

        // Luodaan uusi tapahtumavaraus jyrättyjen varausten tilalle
        Reservation eventReservation = Reservation.CreateEvent(
            ReservationId.New(),
            userId,
            user.Role,
            timeWindow,
            nowUtc);

        await _reservationRepository.AddAsync(eventReservation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Lähetetään ilmoitus uudesta tapahtumasta Discordiin
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

    /// <summary>
    /// Hakee yksittäisen varauksen tiedot tunnisteen perusteella.
    /// </summary>
    /// <param name="reservationId">Haettavan varauksen tunniste.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Onnistunut tulos varauksen tiedoista tai NotFound-virhe.</returns>
    public async Task<Result<ReservationResponse>> GetByIdAsync(
        Guid reservationId,
        CancellationToken cancellationToken = default)
    {
        // Haetaan varaus ja siihen liittyvä käyttäjä tietovarastosta
        Reservation? reservation = await _reservationRepository.GetByIdAsync(new ReservationId(reservationId), cancellationToken);
        if (reservation is null)
        {
            return Result.Failure<ReservationResponse>(Error.NotFound("Reservation.NotFound", "Varausta ei löytynyt."));
        }

        User? user = await _userRepository.GetByIdAsync(reservation.UserId, cancellationToken);
        return Result.Success(MapToResponse(reservation, user));
    }

    /// <summary>
    /// Hakee kaikki annetulle aikavälille osuvat aktiiviset varaukset käyttäjätietoineen.
    /// </summary>
    /// <param name="startUtc">Aikaikkunan alkamisaika UTC-muodossa.</param>
    /// <param name="endUtc">Aikaikkunan päättymisaika UTC-muodossa.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Onnistunut tulos aktiivisista varauksista.</returns>
    public async Task<Result<IReadOnlyList<ReservationResponse>>> GetActiveReservationsAsync(
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        CancellationToken cancellationToken = default)
    {
        // Tarkistetaan, että aikavälin alkuaika on ennen loppuaikaa
        if (startUtc >= endUtc)
        {
            return Result.Failure<IReadOnlyList<ReservationResponse>>(
                Error.Validation("TimeWindow.Invalid", "Alkuajan on oltava ennen loppuaikaa."));
        }

        TimeWindow window = TimeWindow.FromExact(startUtc, endUtc);
        IReadOnlyList<Reservation> active = await _reservationRepository.GetActiveReservationsInWindowAsync(window, cancellationToken);

        // Täydennetään varauksiin varaajan näyttönimi ja sähköposti
        List<ReservationResponse> responses = new List<ReservationResponse>(active.Count);
        foreach (Reservation r in active)
        {
            User? user = await _userRepository.GetByIdAsync(r.UserId, cancellationToken);
            responses.Add(MapToResponse(r, user));
        }

        return Result.Success<IReadOnlyList<ReservationResponse>>(responses);
    }

    // Muuntaa Reservation-entiteetin ja valinnaisen User-entiteetin ReservationResponse-vastausmalliksi
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
