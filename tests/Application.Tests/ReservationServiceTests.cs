using FluentValidation;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Application.Common;
using Pelihuone.Application.Reservations;
using Pelihuone.Application.Reservations.Validators;
using Pelihuone.Application.Settings;
using Pelihuone.Contracts.Reservations;
using Pelihuone.Contracts.Settings;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Tests;

/// <summary>
/// Yksikkötestit <see cref="ReservationService"/>-palveluluokalle, joka vastaa varausjärjestelmän liiketoimintasäännöistä,
/// päällekkäisyystarkistuksista, kiintiöistä ja käyttöoikeuksista.
/// </summary>
public class ReservationServiceTests
{
    private readonly IReservationRepository _reservationRepository = Substitute.For<IReservationRepository>();
    private readonly IGamingStationRepository _gamingStationRepository = Substitute.For<IGamingStationRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();
    private readonly ISettingsService _settingsService = Substitute.For<ISettingsService>();
    private readonly FakeTimeProvider _fakeTimeProvider = new();
    private readonly ReservationService _service;

    /// <summary>
    /// Alustaa uuden <see cref="ReservationServiceTests"/>-testiluokan kiinteällä testiajalla, validaattoreilla ja mock-repositorioilla.
    /// </summary>
    public ReservationServiceTests()
    {
        // Asetetaan kiinteä aika maanantaille (2.11.2026 klo 08:00 EET arkipäivä) determinististä aikaikkunoiden testausta varten
        DateTimeOffset fixedTime = new DateTimeOffset(2026, 11, 2, 8, 0, 0, TimeSpan.FromHours(2));
        _fakeTimeProvider.SetUtcNow(fixedTime);
        _dateTimeProvider.UtcNow.Returns(_fakeTimeProvider.GetUtcNow());

        _settingsService.GetSettingsAsync(Arg.Any<CancellationToken>())
            .Returns(Result.Success(new SiteSettingsResponse(
                DiscordWebhookUrl: "",
                OpeningHoursText: "08:00 - 18:00",
                OpenTimeHour: 8,
                CloseTimeHour: 18,
                OnlyWeekdays: true,
                MaxAdvanceBookingMonths: 2,
                MaxIndividualHours: 4,
                MaxStudentRoomHours: 4,
                MinReservationMinutes: 30,
                EnforceSharedTvLock: true,
                IsMaintenanceMode: false,
                MaintenanceMessage: "")));

        _service = new ReservationService(
            _reservationRepository,
            _gamingStationRepository,
            _userRepository,
            _unitOfWork,
            _dateTimeProvider,
            new CreateReservationRequestValidator(_dateTimeProvider),
            new CancelReservationRequestValidator(),
            NullLogger<ReservationService>.Instance,
            null,
            _settingsService);
    }

    /// <summary>
    /// Varmistaa, että päällekkäinen varaus samalle pelipisteelle hylätään <c>Reservation.StationConflict</c>-virheellä (Sääntö 1).
    /// </summary>
    [Fact]
    public async Task CreateReservation_WhenStationConflict_ReturnsConflictResult()
    {
        // Arrange (Sääntö 1)
        Guid userId = Guid.NewGuid();
        Guid stationId = Guid.NewGuid();
        User user = User.Create(new UserId(userId), SchoolEmail.Create("user@edu.xamk.fi"), "Matti", UserRole.User, _dateTimeProvider.UtcNow);
        GamingStation station = GamingStation.Create(new GamingStationId(stationId), "PC 1", GamingStationType.PC);

        _userRepository.GetByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>()).Returns(user);
        _gamingStationRepository.GetByIdAsync(Arg.Any<GamingStationId>(), Arg.Any<CancellationToken>()).Returns(station);

        // Asetetaan, että pelipisteellä on jo konflikti
        _reservationRepository.HasConflictForStationAsync(
            Arg.Any<GamingStationId>(),
            Arg.Any<TimeWindow>(),
            Arg.Any<ReservationId?>(),
            Arg.Any<CancellationToken>())
            .Returns(true);

        CreateReservationRequest request = new CreateReservationRequest(
            "idem-key-1",
            userId,
            (int)ReservationType.Individual,
            stationId,
            _dateTimeProvider.UtcNow.AddHours(2), // 10:00
            _dateTimeProvider.UtcNow.AddHours(4)); // 12:00

        // Act: Yritetään varata jo varattu pelipiste
        Result<ReservationResponse> result = await _service.CreateReservationAsync(request);

        // Assert: Varmistetaan, että palautetaan ristiriitavirhe
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Conflict, result.Error.Type);
        Assert.Equal("Reservation.StationConflict", result.Error.Code);
    }

    /// <summary>
    /// Varmistaa, että Nintendo Switchiä ei voi varata, jos saman television jakava PlayStation 5 on jo varattuna samalle ajalle (Sääntö 6).
    /// </summary>
    [Fact]
    public async Task CreateReservation_WhenSharedTvInUse_ReturnsConflict()
    {
        // Arrange (Sääntö 6: PS5 ja Switch jakavat saman TV:n)
        Guid userId = Guid.NewGuid();
        Guid switchId = Guid.NewGuid();
        User user = User.Create(new UserId(userId), SchoolEmail.Create("user@edu.xamk.fi"), "Matti", UserRole.User, _dateTimeProvider.UtcNow);
        GamingStation switchStation = GamingStation.Create(new GamingStationId(switchId), "Nintendo Switch", GamingStationType.NintendoSwitch);

        _userRepository.GetByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>()).Returns(user);
        _gamingStationRepository.GetByIdAsync(Arg.Any<GamingStationId>(), Arg.Any<CancellationToken>()).Returns(switchStation);

        // SharedTV on varattu (esim. joku varannut PS5:n samalle ajalle)
        _reservationRepository.HasSharedTvConflictAsync(
            Arg.Any<TimeWindow>(),
            Arg.Any<ReservationId?>(),
            Arg.Any<CancellationToken>())
            .Returns(true);

        CreateReservationRequest request = new CreateReservationRequest(
            "idem-key-2",
            userId,
            (int)ReservationType.Individual,
            switchId,
            _dateTimeProvider.UtcNow.AddHours(2),
            _dateTimeProvider.UtcNow.AddHours(4));

        // Act: Yritetään luoda varaus Nintendo Switchille
        Result<ReservationResponse> result = await _service.CreateReservationAsync(request);

        // Assert: Varmistetaan, että jaetun TV:n konflikti estää varauksen
        Assert.True(result.IsFailure);
        Assert.Equal("Reservation.SharedTvConflict", result.Error.Code);
    }

    /// <summary>
    /// Varmistaa, että toinen tavallinen opiskelijakäyttäjä ei voi peruuttaa toisen käyttäjän varausta (Anti-IDOR).
    /// </summary>
    [Fact]
    public async Task CancelReservation_WhenUserIsNotOwnerAndNotStaff_ReturnsForbidden()
    {
        // Arrange (Anti-IDOR / Käyttöoikeustarkistus)
        Guid ownerId = Guid.NewGuid();
        Guid hackerId = Guid.NewGuid();
        Guid resId = Guid.NewGuid();

        GamingStationId stationId = GamingStationId.New();
        TimeWindow window = TimeWindow.Create(
            _dateTimeProvider.UtcNow.AddHours(2),
            _dateTimeProvider.UtcNow.AddHours(4),
            ReservationType.Individual,
            _dateTimeProvider.UtcNow);

        Reservation reservation = Reservation.CreateIndividual(
            new ReservationId(resId),
            new UserId(ownerId),
            stationId,
            window,
            _dateTimeProvider.UtcNow);

        User hackerUser = User.Create(new UserId(hackerId), SchoolEmail.Create("hacker@edu.xamk.fi"), "Hacker", UserRole.User, _dateTimeProvider.UtcNow);

        _reservationRepository.GetByIdAsync(Arg.Any<ReservationId>(), Arg.Any<CancellationToken>()).Returns(reservation);
        _userRepository.GetByIdAsync(new UserId(hackerId), Arg.Any<CancellationToken>()).Returns(hackerUser);

        CancelReservationRequest cancelRequest = new CancelReservationRequest(hackerId, "Yritän perua toisen varauksen");

        // Act: Yritetään peruuttaa toisen käyttäjän varaus
        Result<ReservationResponse> result = await _service.CancelReservationAsync(resId, cancelRequest);

        // Assert: Varmistetaan, että operaatio estetään Forbidden-virheellä
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Forbidden, result.Error.Type);
    }

    /// <summary>
    /// Varmistaa, että SuperAdmin voi jyrätä päällekkäiset opiskelijavaraukset ja luoda tapahtumavarauksen (Sääntö 8).
    /// </summary>
    [Fact]
    public async Task OverrideAndCreateEvent_WhenSuperAdmin_CancelsExistingReservationsAndCreatesEvent()
    {
        // Arrange (Sääntö 8: SuperAdmin jyräys)
        Guid superAdminId = Guid.NewGuid();
        User superAdmin = User.Create(new UserId(superAdminId), SchoolEmail.Create("opettaja@xamk.fi"), "Opettaja", UserRole.SuperAdmin, _dateTimeProvider.UtcNow);

        _userRepository.GetByIdAsync(new UserId(superAdminId), Arg.Any<CancellationToken>()).Returns(superAdmin);

        GamingStationId stationId = GamingStationId.New();
        TimeWindow window = TimeWindow.Create(
            _dateTimeProvider.UtcNow.AddHours(2),
            _dateTimeProvider.UtcNow.AddHours(6),
            ReservationType.Event,
            _dateTimeProvider.UtcNow);

        Reservation existingRes = Reservation.CreateIndividual(
            ReservationId.New(),
            UserId.New(),
            stationId,
            TimeWindow.Create(_dateTimeProvider.UtcNow.AddHours(3), _dateTimeProvider.UtcNow.AddHours(5), ReservationType.Individual, _dateTimeProvider.UtcNow),
            _dateTimeProvider.UtcNow);

        _reservationRepository.GetActiveReservationsInWindowAsync(Arg.Any<TimeWindow>(), Arg.Any<CancellationToken>())
            .Returns([existingRes]);

        CreateReservationRequest request = new CreateReservationRequest(
            "superadmin-idem-1",
            superAdminId,
            (int)ReservationType.Event,
            null,
            window.StartUtc,
            window.EndUtc);

        // Act: Suoritetaan jyräys ja tapahtuman luonti SuperAdmin-oikeuksilla
        Result<ReservationResponse> result = await _service.OverrideAndCreateEventAsync(request, "Turnaus pelihuoneessa");

        // Assert: Varmistetaan, että aiempi varaus peruuntui perusteluineen ja uusi tapahtuma tallennettiin
        Assert.True(result.IsSuccess);
        Assert.Equal(ReservationStatus.Cancelled, existingRes.Status);
        Assert.Contains("Turnaus pelihuoneessa", existingRes.CancellationReason);

        await _reservationRepository.Received(1).AddAsync(Arg.Any<Reservation>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Varmistaa, että tavallinen käyttäjä ei voi käyttää SuperAdmin-jyräystoimintoa tapahtuman luomiseen (Sääntö 8).
    /// </summary>
    [Fact]
    public async Task OverrideAndCreateEvent_WhenNormalUser_ReturnsForbidden()
    {
        // Arrange (Sääntö 8: Tavallinen käyttäjä ei voi jyrätä)
        Guid userId = Guid.NewGuid();
        User user = User.Create(new UserId(userId), SchoolEmail.Create("user@edu.xamk.fi"), "Matti", UserRole.User, _dateTimeProvider.UtcNow);

        _userRepository.GetByIdAsync(new UserId(userId), Arg.Any<CancellationToken>()).Returns(user);

        CreateReservationRequest request = new CreateReservationRequest(
            "normal-idem-1",
            userId,
            (int)ReservationType.Event,
            null,
            _dateTimeProvider.UtcNow.AddHours(2),
            _dateTimeProvider.UtcNow.AddHours(6));

        // Act: Yritetään jyrätä varaukset tavallisena opiskelijana
        Result<ReservationResponse> result = await _service.OverrideAndCreateEventAsync(request, "Oma lanitapahtuma");

        // Assert: Varmistetaan, että kutsu palauttaa Forbidden-virheen
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Forbidden, result.Error.Type);
    }

    /// <summary>
    /// Varmistaa, että opiskelijan yrittäessä varata koko pelihuonetta yli 4 tunniksi varaus hylätään kestorajoituksen vuoksi.
    /// </summary>
    [Fact]
    public async Task CreateReservation_WhenStudentBooksRoomForMoreThan4Hours_ReturnsValidationFailure()
    {
        // Arrange: Opiskelija yrittää tilavarausta 5 tunniksi
        Guid userId = Guid.NewGuid();
        User user = User.Create(new UserId(userId), SchoolEmail.Create("student@edu.xamk.fi"), "Teemu", UserRole.User, _dateTimeProvider.UtcNow);
        _userRepository.GetByIdAsync(new UserId(userId), Arg.Any<CancellationToken>()).Returns(user);

        DateTimeOffset startUtc = _dateTimeProvider.UtcNow.AddHours(1);
        DateTimeOffset endUtc = startUtc.AddHours(5); // 5h > 4h

        CreateReservationRequest request = new CreateReservationRequest(
            "student-room-idem",
            userId,
            (int)ReservationType.Room,
            null,
            startUtc,
            endUtc);

        // Act: Yritetään luoda yli 4 tunnin tilavaraus
        Result<ReservationResponse> result = await _service.CreateReservationAsync(request);

        // Assert: Varmistetaan, että varaus epäonnistuu RoomDurationExceeded-virhekoodilla
        Assert.True(result.IsFailure);
        Assert.Equal("Reservation.RoomDurationExceeded", result.Error.Code);
    }

    /// <summary>
    /// Varmistaa, että opiskelija ei voi ylittää päivittäistä 4 tunnin enimmäisvarauskiintiötä useilla erillisillä varauksilla.
    /// </summary>
    [Fact]
    public async Task CreateReservation_WhenStudentExceedsDaily4HoursQuota_ReturnsValidationFailure()
    {
        // Arrange: Opiskelijalla on jo 3h varaus, yrittää toista 2h varausta samalle päivälle (3h + 2h = 5h > 4h)
        Guid userId = Guid.NewGuid();
        User user = User.Create(new UserId(userId), SchoolEmail.Create("student@edu.xamk.fi"), "Teemu", UserRole.User, _dateTimeProvider.UtcNow);
        _userRepository.GetByIdAsync(new UserId(userId), Arg.Any<CancellationToken>()).Returns(user);

        DateTimeOffset startUtc = _dateTimeProvider.UtcNow.AddHours(1);
        DateTimeOffset endUtc = startUtc.AddHours(2);

        Reservation existingRes = Reservation.CreateIndividual(
            ReservationId.New(),
            new UserId(userId),
            GamingStationId.New(),
            TimeWindow.FromExact(startUtc.AddHours(-3), startUtc),
            _dateTimeProvider.UtcNow);

        _reservationRepository.GetActiveReservationsForUserAsync(new UserId(userId), Arg.Any<CancellationToken>())
            .Returns(new List<Reservation> { existingRes });

        CreateReservationRequest request = new CreateReservationRequest(
            "student-quota-idem",
            userId,
            (int)ReservationType.Individual,
            existingRes.GamingStationId!.Value.Value,
            startUtc,
            endUtc);

        // Act: Yritetään luoda toinen varaus, joka nostaa päivän kokonaisajan 5 tuntiin
        Result<ReservationResponse> result = await _service.CreateReservationAsync(request);

        // Assert: Varmistetaan, että päiväkiintiön ylitys estää varauksen
        Assert.True(result.IsFailure);
        Assert.Equal("Reservation.DailyLimitExceeded", result.Error.Code);
    }

    /// <summary>
    /// Varmistaa, että käyttöestossa (bannattu) oleva käyttäjä ei voi luoda uutta varausta.
    /// </summary>
    [Fact]
    public async Task CreateReservation_WhenUserIsBanned_ReturnsForbidden()
    {
        // Arrange: Luodaan käyttäjä, jolla on aktiivinen banni
        Guid userId = Guid.NewGuid();
        User bannedUser = User.Create(new UserId(userId), SchoolEmail.Create("banned@edu.xamk.fi"), "Bannattu", UserRole.User, _dateTimeProvider.UtcNow.AddDays(-5));
        bannedUser.Ban(_dateTimeProvider.UtcNow.AddDays(3), "Sääntörikkomus pelitilassa");

        _userRepository.GetByIdAsync(new UserId(userId), Arg.Any<CancellationToken>()).Returns(bannedUser);

        DateTimeOffset startUtc = _dateTimeProvider.UtcNow.AddHours(1);
        CreateReservationRequest request = new CreateReservationRequest(
            "banned-idem-key",
            userId,
            (int)ReservationType.Individual,
            Guid.NewGuid(),
            startUtc,
            startUtc.AddHours(2));

        // Act
        Result<ReservationResponse> result = await _service.CreateReservationAsync(request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Forbidden, result.Error.Type);
        Assert.Equal("User.Banned", result.Error.Code);
    }

    /// <summary>
    /// Varmistaa, että huoltotilassa olevalle pelipisteelle ei voida tehdä varausta.
    /// </summary>
    [Fact]
    public async Task CreateReservation_WhenStationIsInactive_ReturnsNotFound()
    {
        // Arrange: Pelipiste on asetettu huoltotilaan (IsActive = false)
        Guid userId = Guid.NewGuid();
        Guid stationId = Guid.NewGuid();
        User user = User.Create(new UserId(userId), SchoolEmail.Create("user@edu.xamk.fi"), "Matti", UserRole.User, _dateTimeProvider.UtcNow);
        GamingStation station = GamingStation.Create(new GamingStationId(stationId), "PC 1", GamingStationType.PC);
        station.Deactivate();

        _userRepository.GetByIdAsync(new UserId(userId), Arg.Any<CancellationToken>()).Returns(user);
        _gamingStationRepository.GetByIdAsync(new GamingStationId(stationId), Arg.Any<CancellationToken>()).Returns(station);

        DateTimeOffset startUtc = _dateTimeProvider.UtcNow.AddHours(1);
        CreateReservationRequest request = new CreateReservationRequest(
            "inactive-station-idem",
            userId,
            (int)ReservationType.Individual,
            stationId,
            startUtc,
            startUtc.AddHours(2));

        // Act
        Result<ReservationResponse> result = await _service.CreateReservationAsync(request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("GamingStation.NotFound", result.Error.Code);
    }

    /// <summary>
    /// Varmistaa, että tilapäisessä huoltotilassa tavallisen opiskelijan varaus estetään.
    /// </summary>
    [Fact]
    public async Task CreateReservation_WhenMaintenanceModeActiveAndNormalUser_ReturnsMaintenanceError()
    {
        // Arrange: Asetukset määrittelevät huoltotilan olevan päällä
        _settingsService.GetSettingsAsync(Arg.Any<CancellationToken>())
            .Returns(Result.Success(new SiteSettingsResponse(
                DiscordWebhookUrl: "",
                OpeningHoursText: "08:00 - 18:00",
                OpenTimeHour: 8,
                CloseTimeHour: 18,
                OnlyWeekdays: true,
                MaxAdvanceBookingMonths: 2,
                MaxIndividualHours: 4,
                MaxStudentRoomHours: 4,
                MinReservationMinutes: 30,
                EnforceSharedTvLock: true,
                IsMaintenanceMode: true,
                MaintenanceMessage: "Pelitilan verkkohuolto käynnissä")));

        Guid userId = Guid.NewGuid();
        User normalUser = User.Create(new UserId(userId), SchoolEmail.Create("student@edu.xamk.fi"), "Opiskelija", UserRole.User, _dateTimeProvider.UtcNow);
        _userRepository.GetByIdAsync(new UserId(userId), Arg.Any<CancellationToken>()).Returns(normalUser);

        DateTimeOffset startUtc = _dateTimeProvider.UtcNow.AddHours(1);
        CreateReservationRequest request = new CreateReservationRequest(
            "maint-idem-key",
            userId,
            (int)ReservationType.Individual,
            Guid.NewGuid(),
            startUtc,
            startUtc.AddHours(2));

        // Act
        Result<ReservationResponse> result = await _service.CreateReservationAsync(request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Reservation.MaintenanceMode", result.Error.Code);
    }

    /// <summary>
    /// Varmistaa, että ylläpitäjä (Admin) voi tehdä varauksia vaikka pelitila olisi huoltotilassa.
    /// </summary>
    [Fact]
    public async Task CreateReservation_WhenMaintenanceModeActiveAndAdminUser_AllowsReservation()
    {
        // Arrange: Huoltotila päällä, mutta varaajana Admin
        _settingsService.GetSettingsAsync(Arg.Any<CancellationToken>())
            .Returns(Result.Success(new SiteSettingsResponse(
                DiscordWebhookUrl: "",
                OpeningHoursText: "08:00 - 18:00",
                OpenTimeHour: 8,
                CloseTimeHour: 18,
                OnlyWeekdays: true,
                MaxAdvanceBookingMonths: 2,
                MaxIndividualHours: 4,
                MaxStudentRoomHours: 4,
                MinReservationMinutes: 30,
                EnforceSharedTvLock: true,
                IsMaintenanceMode: true,
                MaintenanceMessage: "Huoltokatko")));

        Guid adminId = Guid.NewGuid();
        Guid stationId = Guid.NewGuid();
        User adminUser = User.Create(new UserId(adminId), SchoolEmail.Create("admin@xamk.fi"), "Valvoja", UserRole.Admin, _dateTimeProvider.UtcNow);
        GamingStation station = GamingStation.Create(new GamingStationId(stationId), "PC 1", GamingStationType.PC);

        _userRepository.GetByIdAsync(new UserId(adminId), Arg.Any<CancellationToken>()).Returns(adminUser);
        _gamingStationRepository.GetByIdAsync(new GamingStationId(stationId), Arg.Any<CancellationToken>()).Returns(station);

        DateTimeOffset startUtc = _dateTimeProvider.UtcNow.AddHours(1);
        CreateReservationRequest request = new CreateReservationRequest(
            "admin-maint-idem",
            adminId,
            (int)ReservationType.Individual,
            stationId,
            startUtc,
            startUtc.AddHours(2));

        // Act
        Result<ReservationResponse> result = await _service.CreateReservationAsync(request);

        // Assert: Admin saa luoda varauksen huoltotilasta huolimatta
        Assert.True(result.IsSuccess);
        await _reservationRepository.Received(1).AddAsync(Arg.Any<Reservation>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
