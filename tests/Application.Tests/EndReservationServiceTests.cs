using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Application.Common;
using Pelihuone.Application.Reservations;
using Pelihuone.Application.Reservations.Validators;
using Pelihuone.Contracts.Reservations;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Tests;

/// <summary>
/// Use case -testit <see cref="ReservationService.EndReservationEarlyAsync"/>-metodille (Spec 004, sääntö 12, kriteerit K1–K5).
/// </summary>
public sealed class EndReservationServiceTests
{
    private readonly IReservationRepository _reservationRepository = Substitute.For<IReservationRepository>();
    private readonly IGamingStationRepository _gamingStationRepository = Substitute.For<IGamingStationRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();
    private readonly ISettingsService _settingsService = Substitute.For<ISettingsService>();
    private readonly ReservationService _service;

    /// <summary>
    /// Alustaa uuden <see cref="EndReservationServiceTests"/>-testiluokan mock-repositorioilla ja kiinteän kellon abstraktiolla.
    /// </summary>
    public EndReservationServiceTests()
    {
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

    private static DateTimeOffset CreateEetTime(int hour, int minute)
    {
        return new DateTimeOffset(2026, 11, 2, hour, minute, 0, TimeSpan.FromHours(2));
    }

    private static Reservation CreateReservation(
        Guid reservationId,
        Guid ownerId,
        DateTimeOffset startUtc,
        DateTimeOffset endUtc,
        DateTimeOffset createdUtc)
    {
        TimeWindow window = TimeWindow.FromExact(startUtc, endUtc);
        return Reservation.CreateIndividual(
            new ReservationId(reservationId),
            new UserId(ownerId),
            GamingStationId.New(),
            window,
            createdUtc);
    }

    /// <summary>
    /// K1: Omistaja lopettaa käynnissä olevan varauksen klo 10:15, jolloin päättymisaika katkaistaan nykyhetkeen,
    /// tila säilyy aktiivisena, muutos tallennetaan ja laite vapautuu uuteen varaukseen klo 10:15 alkaen.
    /// </summary>
    [Fact]
    public async Task EndReservationEarlyAsync_WhenOwnerEndsOngoingReservation_TruncatesEndTimeAndFreesStation()
    {
        // Arrange (K1: varaus 09:00–12:00, kello 10:15)
        DateTimeOffset nowUtc = CreateEetTime(10, 15).ToUniversalTime();
        DateTimeOffset startUtc = CreateEetTime(9, 0).ToUniversalTime();
        DateTimeOffset endUtc = CreateEetTime(12, 0).ToUniversalTime();
        DateTimeOffset createdUtc = CreateEetTime(8, 0).ToUniversalTime();

        _dateTimeProvider.UtcNow.Returns(nowUtc);

        Guid ownerId = Guid.NewGuid();
        Guid reservationId = Guid.NewGuid();
        User owner = User.Create(new UserId(ownerId), SchoolEmail.Create("opiskelija1@edu.xamk.fi"), "Opiskelija 1", UserRole.User, createdUtc);
        Reservation reservation = CreateReservation(reservationId, ownerId, startUtc, endUtc, createdUtc);

        _reservationRepository.GetByIdAsync(new ReservationId(reservationId), Arg.Any<CancellationToken>()).Returns(reservation);
        _userRepository.GetByIdAsync(new UserId(ownerId), Arg.Any<CancellationToken>()).Returns(owner);

        EndReservationRequest request = new EndReservationRequest(ownerId);

        // Act
        Result<ReservationResponse> result = await _service.EndReservationEarlyAsync(reservationId, request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(nowUtc, result.Value.EndUtc);
        Assert.Equal(ReservationStatus.Active.ToString(), result.Value.Status);
        Assert.Equal(ReservationStatus.Active, reservation.Status);
        Assert.Equal(nowUtc, reservation.TimeWindow.EndUtc);

        await _reservationRepository.Received(1).UpdateAsync(reservation, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());

        // Varmistetaan, että katkaistu aikaikkuna ei enää leikkaa klo 10:15–11:15 alkavaa uutta varausta
        TimeWindow nextReservationWindow = TimeWindow.FromExact(
            CreateEetTime(10, 15).ToUniversalTime(),
            CreateEetTime(11, 15).ToUniversalTime());
        Assert.False(reservation.TimeWindow.OverlapsWith(nextReservationWindow));
    }

    /// <summary>
    /// K2: Tulevan (vielä alkamattoman) varauksen lopettaminen kesken hylätään Conflict-virheellä <c>Reservation.CannotEndEarly</c>.
    /// </summary>
    [Fact]
    public async Task EndReservationEarlyAsync_WhenReservationHasNotStarted_ReturnsConflict()
    {
        // Arrange (K2: varaus 11:00–13:00, kello 09:00)
        DateTimeOffset nowUtc = CreateEetTime(9, 0).ToUniversalTime();
        DateTimeOffset startUtc = CreateEetTime(11, 0).ToUniversalTime();
        DateTimeOffset endUtc = CreateEetTime(13, 0).ToUniversalTime();
        DateTimeOffset createdUtc = CreateEetTime(8, 0).ToUniversalTime();

        _dateTimeProvider.UtcNow.Returns(nowUtc);

        Guid ownerId = Guid.NewGuid();
        Guid reservationId = Guid.NewGuid();
        User owner = User.Create(new UserId(ownerId), SchoolEmail.Create("opiskelija1@edu.xamk.fi"), "Opiskelija 1", UserRole.User, createdUtc);
        Reservation reservation = CreateReservation(reservationId, ownerId, startUtc, endUtc, createdUtc);

        _reservationRepository.GetByIdAsync(new ReservationId(reservationId), Arg.Any<CancellationToken>()).Returns(reservation);
        _userRepository.GetByIdAsync(new UserId(ownerId), Arg.Any<CancellationToken>()).Returns(owner);

        EndReservationRequest request = new EndReservationRequest(ownerId);

        // Act
        Result<ReservationResponse> result = await _service.EndReservationEarlyAsync(reservationId, request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Conflict, result.Error.Type);
        Assert.Equal("Reservation.CannotEndEarly", result.Error.Code);

        await _reservationRepository.DidNotReceive().UpdateAsync(Arg.Any<Reservation>(), Arg.Any<CancellationToken>());
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// K3: Jo päättyneen varauksen lopettaminen kesken hylätään Conflict-virheellä <c>Reservation.CannotEndEarly</c>.
    /// </summary>
    [Fact]
    public async Task EndReservationEarlyAsync_WhenReservationHasAlreadyEnded_ReturnsConflict()
    {
        // Arrange (K3a: varaus 08:00–09:00, kello 09:30)
        DateTimeOffset nowUtc = CreateEetTime(9, 30).ToUniversalTime();
        DateTimeOffset startUtc = CreateEetTime(8, 0).ToUniversalTime();
        DateTimeOffset endUtc = CreateEetTime(9, 0).ToUniversalTime();
        DateTimeOffset createdUtc = CreateEetTime(7, 30).ToUniversalTime();

        _dateTimeProvider.UtcNow.Returns(nowUtc);

        Guid ownerId = Guid.NewGuid();
        Guid reservationId = Guid.NewGuid();
        User owner = User.Create(new UserId(ownerId), SchoolEmail.Create("opiskelija1@edu.xamk.fi"), "Opiskelija 1", UserRole.User, createdUtc);
        Reservation reservation = CreateReservation(reservationId, ownerId, startUtc, endUtc, createdUtc);

        _reservationRepository.GetByIdAsync(new ReservationId(reservationId), Arg.Any<CancellationToken>()).Returns(reservation);
        _userRepository.GetByIdAsync(new UserId(ownerId), Arg.Any<CancellationToken>()).Returns(owner);

        EndReservationRequest request = new EndReservationRequest(ownerId);

        // Act
        Result<ReservationResponse> result = await _service.EndReservationEarlyAsync(reservationId, request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Conflict, result.Error.Type);
        Assert.Equal("Reservation.CannotEndEarly", result.Error.Code);

        await _reservationRepository.DidNotReceive().UpdateAsync(Arg.Any<Reservation>(), Arg.Any<CancellationToken>());
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// K3: Perutun varauksen lopettaminen kesken hylätään Conflict-virheellä <c>Reservation.CannotEndEarly</c>.
    /// </summary>
    [Fact]
    public async Task EndReservationEarlyAsync_WhenReservationIsCancelled_ReturnsConflict()
    {
        // Arrange (K3b: peruttu varaus)
        DateTimeOffset nowUtc = CreateEetTime(10, 0).ToUniversalTime();
        DateTimeOffset startUtc = CreateEetTime(9, 0).ToUniversalTime();
        DateTimeOffset endUtc = CreateEetTime(12, 0).ToUniversalTime();
        DateTimeOffset createdUtc = CreateEetTime(7, 30).ToUniversalTime();

        _dateTimeProvider.UtcNow.Returns(nowUtc);

        Guid ownerId = Guid.NewGuid();
        Guid reservationId = Guid.NewGuid();
        User owner = User.Create(new UserId(ownerId), SchoolEmail.Create("opiskelija1@edu.xamk.fi"), "Opiskelija 1", UserRole.User, createdUtc);
        Reservation reservation = CreateReservation(reservationId, ownerId, startUtc, endUtc, createdUtc);
        reservation.Cancel(CreateEetTime(8, 0).ToUniversalTime(), new UserId(ownerId), UserRole.User, "En pääsekään");

        _reservationRepository.GetByIdAsync(new ReservationId(reservationId), Arg.Any<CancellationToken>()).Returns(reservation);
        _userRepository.GetByIdAsync(new UserId(ownerId), Arg.Any<CancellationToken>()).Returns(owner);

        EndReservationRequest request = new EndReservationRequest(ownerId);

        // Act
        Result<ReservationResponse> result = await _service.EndReservationEarlyAsync(reservationId, request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Conflict, result.Error.Type);
        Assert.Equal("Reservation.CannotEndEarly", result.Error.Code);

        await _reservationRepository.DidNotReceive().UpdateAsync(Arg.Any<Reservation>(), Arg.Any<CancellationToken>());
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// K4: Toinen tavallinen opiskelija ei voi lopettaa toisen käyttäjän käynnissä olevaa varausta (Anti-IDOR).
    /// </summary>
    [Fact]
    public async Task EndReservationEarlyAsync_WhenOtherStudentTriesToEnd_ReturnsForbidden()
    {
        // Arrange (K4: varaus 09:00–12:00, kello 10:00, pyytäjä opiskelija 2)
        DateTimeOffset nowUtc = CreateEetTime(10, 0).ToUniversalTime();
        DateTimeOffset startUtc = CreateEetTime(9, 0).ToUniversalTime();
        DateTimeOffset endUtc = CreateEetTime(12, 0).ToUniversalTime();
        DateTimeOffset createdUtc = CreateEetTime(8, 0).ToUniversalTime();

        _dateTimeProvider.UtcNow.Returns(nowUtc);

        Guid ownerId = Guid.NewGuid();
        Guid otherStudentId = Guid.NewGuid();
        Guid reservationId = Guid.NewGuid();
        User otherStudent = User.Create(new UserId(otherStudentId), SchoolEmail.Create("opiskelija2@edu.xamk.fi"), "Opiskelija 2", UserRole.User, createdUtc);
        Reservation reservation = CreateReservation(reservationId, ownerId, startUtc, endUtc, createdUtc);

        _reservationRepository.GetByIdAsync(new ReservationId(reservationId), Arg.Any<CancellationToken>()).Returns(reservation);
        _userRepository.GetByIdAsync(new UserId(otherStudentId), Arg.Any<CancellationToken>()).Returns(otherStudent);

        EndReservationRequest request = new EndReservationRequest(otherStudentId);

        // Act
        Result<ReservationResponse> result = await _service.EndReservationEarlyAsync(reservationId, request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Forbidden, result.Error.Type);
        Assert.Equal("Reservation.Forbidden", result.Error.Code);

        await _reservationRepository.DidNotReceive().UpdateAsync(Arg.Any<Reservation>(), Arg.Any<CancellationToken>());
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// K5: Ylläpitäjä (<see cref="UserRole.Admin"/>) voi lopettaa opiskelijan käynnissä olevan varauksen kesken.
    /// </summary>
    [Fact]
    public async Task EndReservationEarlyAsync_WhenAdminEndsStudentReservation_SucceedsAndUpdatesEndUtc()
    {
        // Arrange (K5: varaus 09:00–12:00, kello 10:00, pyytäjä Admin)
        DateTimeOffset nowUtc = CreateEetTime(10, 0).ToUniversalTime();
        DateTimeOffset startUtc = CreateEetTime(9, 0).ToUniversalTime();
        DateTimeOffset endUtc = CreateEetTime(12, 0).ToUniversalTime();
        DateTimeOffset createdUtc = CreateEetTime(8, 0).ToUniversalTime();

        _dateTimeProvider.UtcNow.Returns(nowUtc);

        Guid ownerId = Guid.NewGuid();
        Guid adminId = Guid.NewGuid();
        Guid reservationId = Guid.NewGuid();
        User admin = User.Create(new UserId(adminId), SchoolEmail.Create("admin@xamk.fi"), "Ylläpitäjä", UserRole.Admin, createdUtc);
        Reservation reservation = CreateReservation(reservationId, ownerId, startUtc, endUtc, createdUtc);

        _reservationRepository.GetByIdAsync(new ReservationId(reservationId), Arg.Any<CancellationToken>()).Returns(reservation);
        _userRepository.GetByIdAsync(new UserId(adminId), Arg.Any<CancellationToken>()).Returns(admin);

        EndReservationRequest request = new EndReservationRequest(adminId);

        // Act
        Result<ReservationResponse> result = await _service.EndReservationEarlyAsync(reservationId, request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(nowUtc, result.Value.EndUtc);
        Assert.Equal(ReservationStatus.Active.ToString(), result.Value.Status);

        await _reservationRepository.Received(1).UpdateAsync(reservation, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// K5: Pääkäyttäjä (<see cref="UserRole.SuperAdmin"/>) voi lopettaa opiskelijan käynnissä olevan varauksen kesken.
    /// </summary>
    [Fact]
    public async Task EndReservationEarlyAsync_WhenSuperAdminEndsStudentReservation_SucceedsAndUpdatesEndUtc()
    {
        // Arrange
        DateTimeOffset nowUtc = CreateEetTime(10, 0).ToUniversalTime();
        DateTimeOffset startUtc = CreateEetTime(9, 0).ToUniversalTime();
        DateTimeOffset endUtc = CreateEetTime(12, 0).ToUniversalTime();
        DateTimeOffset createdUtc = CreateEetTime(8, 0).ToUniversalTime();

        _dateTimeProvider.UtcNow.Returns(nowUtc);

        Guid ownerId = Guid.NewGuid();
        Guid superAdminId = Guid.NewGuid();
        Guid reservationId = Guid.NewGuid();
        User superAdmin = User.Create(new UserId(superAdminId), SchoolEmail.Create("opettaja@xamk.fi"), "Opettaja", UserRole.SuperAdmin, createdUtc);
        Reservation reservation = CreateReservation(reservationId, ownerId, startUtc, endUtc, createdUtc);

        _reservationRepository.GetByIdAsync(new ReservationId(reservationId), Arg.Any<CancellationToken>()).Returns(reservation);
        _userRepository.GetByIdAsync(new UserId(superAdminId), Arg.Any<CancellationToken>()).Returns(superAdmin);

        EndReservationRequest request = new EndReservationRequest(superAdminId);

        // Act
        Result<ReservationResponse> result = await _service.EndReservationEarlyAsync(reservationId, request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(nowUtc, result.Value.EndUtc);
        Assert.Equal(ReservationStatus.Active.ToString(), result.Value.Status);

        await _reservationRepository.Received(1).UpdateAsync(reservation, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Varmistaa, että olemattoman varauksen lopettamisyritys palauttaa NotFound-virheen <c>Reservation.NotFound</c>.
    /// </summary>
    [Fact]
    public async Task EndReservationEarlyAsync_WhenReservationNotFound_ReturnsNotFound()
    {
        // Arrange
        Guid reservationId = Guid.NewGuid();
        Guid userId = Guid.NewGuid();
        _reservationRepository.GetByIdAsync(new ReservationId(reservationId), Arg.Any<CancellationToken>()).Returns((Reservation?)null);

        EndReservationRequest request = new EndReservationRequest(userId);

        // Act
        Result<ReservationResponse> result = await _service.EndReservationEarlyAsync(reservationId, request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.NotFound, result.Error.Type);
        Assert.Equal("Reservation.NotFound", result.Error.Code);
    }

    /// <summary>
    /// Varmistaa, että tyhjällä käyttäjätunnisteella tehty pyyntö palauttaa Validation-virheen <c>Reservation.ValidationFailed</c>.
    /// </summary>
    [Fact]
    public async Task EndReservationEarlyAsync_WhenUserIdIsEmpty_ReturnsValidationFailure()
    {
        // Arrange
        Guid reservationId = Guid.NewGuid();
        EndReservationRequest request = new EndReservationRequest(Guid.Empty);

        // Act
        Result<ReservationResponse> result = await _service.EndReservationEarlyAsync(reservationId, request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Validation, result.Error.Type);
        Assert.Equal("Reservation.ValidationFailed", result.Error.Code);
    }
}
