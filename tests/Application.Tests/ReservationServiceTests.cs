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
using Pelihuone.Contracts.Reservations;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Tests;

public class ReservationServiceTests
{
    private readonly IReservationRepository _reservationRepository = Substitute.For<IReservationRepository>();
    private readonly IGamingStationRepository _gamingStationRepository = Substitute.For<IGamingStationRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();
    private readonly FakeTimeProvider _fakeTimeProvider = new();
    private readonly ReservationService _service;

    public ReservationServiceTests()
    {
        var fixedTime = new DateTimeOffset(2026, 11, 1, 8, 0, 0, TimeSpan.FromHours(2));
        _fakeTimeProvider.SetUtcNow(fixedTime);
        _dateTimeProvider.UtcNow.Returns(_fakeTimeProvider.GetUtcNow());

        _service = new ReservationService(
            _reservationRepository,
            _gamingStationRepository,
            _userRepository,
            _unitOfWork,
            _dateTimeProvider,
            new CreateReservationRequestValidator(),
            new CancelReservationRequestValidator(),
            NullLogger<ReservationService>.Instance);
    }

    [Fact]
    public async Task CreateReservation_WhenStationConflict_ReturnsConflictResult()
    {
        // Arrange (Sääntö 1)
        var userId = Guid.NewGuid();
        var stationId = Guid.NewGuid();
        var user = User.Create(new UserId(userId), SchoolEmail.Create("user@edu.xamk.fi"), "Matti", UserRole.User, _dateTimeProvider.UtcNow);
        var station = GamingStation.Create(new GamingStationId(stationId), "PC 1", GamingStationType.PC);

        _userRepository.GetByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>()).Returns(user);
        _gamingStationRepository.GetByIdAsync(Arg.Any<GamingStationId>(), Arg.Any<CancellationToken>()).Returns(station);

        // Asetetaan, että pelipisteellä on jo konflikti
        _reservationRepository.HasConflictForStationAsync(
            Arg.Any<GamingStationId>(),
            Arg.Any<TimeWindow>(),
            Arg.Any<ReservationId?>(),
            Arg.Any<CancellationToken>())
            .Returns(true);

        var request = new CreateReservationRequest(
            "idem-key-1",
            userId,
            (int)ReservationType.Individual,
            stationId,
            _dateTimeProvider.UtcNow.AddHours(2), // 10:00
            _dateTimeProvider.UtcNow.AddHours(4)); // 12:00

        // Act
        var result = await _service.CreateReservationAsync(request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Conflict, result.Error.Type);
        Assert.Equal("Reservation.StationConflict", result.Error.Code);
    }

    [Fact]
    public async Task CreateReservation_WhenSharedTvInUse_ReturnsConflict()
    {
        // Arrange (Sääntö 6: PS5 ja Switch jakavat saman TV:n)
        var userId = Guid.NewGuid();
        var switchId = Guid.NewGuid();
        var user = User.Create(new UserId(userId), SchoolEmail.Create("user@edu.xamk.fi"), "Matti", UserRole.User, _dateTimeProvider.UtcNow);
        var switchStation = GamingStation.Create(new GamingStationId(switchId), "Nintendo Switch", GamingStationType.NintendoSwitch);

        _userRepository.GetByIdAsync(Arg.Any<UserId>(), Arg.Any<CancellationToken>()).Returns(user);
        _gamingStationRepository.GetByIdAsync(Arg.Any<GamingStationId>(), Arg.Any<CancellationToken>()).Returns(switchStation);

        // SharedTV on varattu (esim. joku varannut PS5:n samalle ajalle)
        _reservationRepository.HasSharedTvConflictAsync(
            Arg.Any<TimeWindow>(),
            Arg.Any<ReservationId?>(),
            Arg.Any<CancellationToken>())
            .Returns(true);

        var request = new CreateReservationRequest(
            "idem-key-2",
            userId,
            (int)ReservationType.Individual,
            switchId,
            _dateTimeProvider.UtcNow.AddHours(2),
            _dateTimeProvider.UtcNow.AddHours(4));

        // Act
        var result = await _service.CreateReservationAsync(request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Reservation.SharedTvConflict", result.Error.Code);
    }

    [Fact]
    public async Task CancelReservation_WhenUserIsNotOwnerAndNotStaff_ReturnsForbidden()
    {
        // Arrange (Anti-IDOR / Käyttöoikeustarkistus)
        var ownerId = Guid.NewGuid();
        var hackerId = Guid.NewGuid();
        var resId = Guid.NewGuid();

        var stationId = GamingStationId.New();
        var window = TimeWindow.Create(
            _dateTimeProvider.UtcNow.AddHours(2),
            _dateTimeProvider.UtcNow.AddHours(4),
            ReservationType.Individual,
            _dateTimeProvider.UtcNow);

        var reservation = Reservation.CreateIndividual(
            new ReservationId(resId),
            new UserId(ownerId),
            stationId,
            window,
            _dateTimeProvider.UtcNow);

        var hackerUser = User.Create(new UserId(hackerId), SchoolEmail.Create("hacker@edu.xamk.fi"), "Hacker", UserRole.User, _dateTimeProvider.UtcNow);

        _reservationRepository.GetByIdAsync(Arg.Any<ReservationId>(), Arg.Any<CancellationToken>()).Returns(reservation);
        _userRepository.GetByIdAsync(new UserId(hackerId), Arg.Any<CancellationToken>()).Returns(hackerUser);

        var cancelRequest = new CancelReservationRequest(hackerId, "Yritän perua toisen varauksen");

        // Act
        var result = await _service.CancelReservationAsync(resId, cancelRequest);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Forbidden, result.Error.Type);
    }

    [Fact]
    public async Task OverrideAndCreateEvent_WhenSuperAdmin_CancelsExistingReservationsAndCreatesEvent()
    {
        // Arrange (Sääntö 8: SuperAdmin jyräys)
        var superAdminId = Guid.NewGuid();
        var superAdmin = User.Create(new UserId(superAdminId), SchoolEmail.Create("opettaja@xamk.fi"), "Opettaja", UserRole.SuperAdmin, _dateTimeProvider.UtcNow);

        _userRepository.GetByIdAsync(new UserId(superAdminId), Arg.Any<CancellationToken>()).Returns(superAdmin);

        var stationId = GamingStationId.New();
        var window = TimeWindow.Create(
            _dateTimeProvider.UtcNow.AddHours(2),
            _dateTimeProvider.UtcNow.AddHours(6),
            ReservationType.Event,
            _dateTimeProvider.UtcNow);

        var existingRes = Reservation.CreateIndividual(
            ReservationId.New(),
            UserId.New(),
            stationId,
            TimeWindow.Create(_dateTimeProvider.UtcNow.AddHours(3), _dateTimeProvider.UtcNow.AddHours(5), ReservationType.Individual, _dateTimeProvider.UtcNow),
            _dateTimeProvider.UtcNow);

        _reservationRepository.GetActiveReservationsInWindowAsync(Arg.Any<TimeWindow>(), Arg.Any<CancellationToken>())
            .Returns([existingRes]);

        var request = new CreateReservationRequest(
            "superadmin-idem-1",
            superAdminId,
            (int)ReservationType.Event,
            null,
            window.StartUtc,
            window.EndUtc);

        // Act
        var result = await _service.OverrideAndCreateEventAsync(request, "Turnaus pelihuoneessa");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(ReservationStatus.Cancelled, existingRes.Status);
        Assert.Contains("Turnaus pelihuoneessa", existingRes.CancellationReason);

        await _reservationRepository.Received(1).AddAsync(Arg.Any<Reservation>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task OverrideAndCreateEvent_WhenNormalUser_ReturnsForbidden()
    {
        // Arrange (Sääntö 8: Tavallinen käyttäjä ei voi jyrätä)
        var userId = Guid.NewGuid();
        var user = User.Create(new UserId(userId), SchoolEmail.Create("user@edu.xamk.fi"), "Matti", UserRole.User, _dateTimeProvider.UtcNow);

        _userRepository.GetByIdAsync(new UserId(userId), Arg.Any<CancellationToken>()).Returns(user);

        var request = new CreateReservationRequest(
            "normal-idem-1",
            userId,
            (int)ReservationType.Event,
            null,
            _dateTimeProvider.UtcNow.AddHours(2),
            _dateTimeProvider.UtcNow.AddHours(6));

        // Act
        var result = await _service.OverrideAndCreateEventAsync(request, "Oma lanitapahtuma");

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Forbidden, result.Error.Type);
    }

    [Fact]
    public async Task CreateReservation_WhenStudentBooksRoomForMoreThan4Hours_ReturnsValidationFailure()
    {
        // Arrange: Opiskelija yrittää tilavarausta 5 tunniksi
        var userId = Guid.NewGuid();
        var user = User.Create(new UserId(userId), SchoolEmail.Create("student@edu.xamk.fi"), "Teemu", UserRole.User, _dateTimeProvider.UtcNow);
        _userRepository.GetByIdAsync(new UserId(userId), Arg.Any<CancellationToken>()).Returns(user);

        var startUtc = _dateTimeProvider.UtcNow.AddHours(1);
        var endUtc = startUtc.AddHours(5); // 5h > 4h

        var request = new CreateReservationRequest(
            "student-room-idem",
            userId,
            (int)ReservationType.Room,
            null,
            startUtc,
            endUtc);

        // Act
        var result = await _service.CreateReservationAsync(request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Reservation.RoomDurationExceeded", result.Error.Code);
    }

    [Fact]
    public async Task CreateReservation_WhenStudentExceedsDaily4HoursQuota_ReturnsValidationFailure()
    {
        // Arrange: Opiskelijalla on jo 3h varaus, yrittää toista 2h varausta samalle päivälle (3h + 2h = 5h > 4h)
        var userId = Guid.NewGuid();
        var user = User.Create(new UserId(userId), SchoolEmail.Create("student@edu.xamk.fi"), "Teemu", UserRole.User, _dateTimeProvider.UtcNow);
        _userRepository.GetByIdAsync(new UserId(userId), Arg.Any<CancellationToken>()).Returns(user);

        var startUtc = _dateTimeProvider.UtcNow.AddHours(1);
        var endUtc = startUtc.AddHours(2);

        var existingRes = Reservation.CreateIndividual(
            ReservationId.New(),
            new UserId(userId),
            GamingStationId.New(),
            TimeWindow.FromExact(startUtc.AddHours(-3), startUtc),
            _dateTimeProvider.UtcNow);

        _reservationRepository.GetActiveReservationsForUserAsync(new UserId(userId), Arg.Any<CancellationToken>())
            .Returns(new List<Reservation> { existingRes });

        var request = new CreateReservationRequest(
            "student-quota-idem",
            userId,
            (int)ReservationType.Individual,
            existingRes.GamingStationId!.Value.Value,
            startUtc,
            endUtc);

        // Act
        var result = await _service.CreateReservationAsync(request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Reservation.DailyLimitExceeded", result.Error.Code);
    }
}
