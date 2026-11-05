using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Application.Common;
using Pelihuone.Application.Users;
using Pelihuone.Application.Users.Validators;
using Pelihuone.Contracts.Users;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Tests;

/// <summary>
/// Yksikkötestit <see cref="UserService"/>-palveluluokalle ja oppilaitossähköpostien validoinnille.
/// </summary>
public class UserServiceTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();
    private readonly UserService _service;

    /// <summary>
    /// Alustaa uuden <see cref="UserServiceTests"/>-testiluokan ja luo testattavan käyttäjäpalvelun.
    /// </summary>
    public UserServiceTests()
    {
        // Asetetaan aikapalvelu palauttamaan nykyinen UTC-aika
        _dateTimeProvider.UtcNow.Returns(DateTimeOffset.UtcNow);

        _service = new UserService(
            _userRepository,
            _unitOfWork,
            _dateTimeProvider,
            new SchoolEmailValidator(),
            NullLogger<UserService>.Instance);
    }

    /// <summary>
    /// Varmistaa, että ulkopuolisilla sähköpostiosoitteilla kirjautuminen hylätään validointivirheellä (Sääntö 7).
    /// </summary>
    /// <param name="invalidEmail">Testattava ei-hyväksyttävä sähköpostiosoite.</param>
    [Theory]
    [InlineData("test@gmail.com")]
    [InlineData("user@hotmail.com")]
    [InlineData("someone@company.fi")]
    public async Task AuthenticateOrCreateUserAsync_WithNonSchoolEmail_ReturnsValidationError(string invalidEmail)
    {
        // Arrange & Act (Sääntö 7)
        Result<UserResponse> result = await _service.AuthenticateOrCreateUserAsync(invalidEmail, "Testaaja");

        // Assert: Ulkopuolisen sähköpostin tulee tuottaa User.InvalidEmail-validointivirhe
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Validation, result.Error.Type);
        Assert.Equal("User.InvalidEmail", result.Error.Code);
    }

    /// <summary>
    /// Varmistaa, että XAMK:n oppilaitossähköposteilla (<c>@edu.xamk.fi</c> ja <c>@xamk.fi</c>) kirjautuminen onnistuu ja luo uuden käyttäjän (Sääntö 7).
    /// </summary>
    /// <param name="validEmail">Testattava kelvollinen oppilaitossähköpostiosoite.</param>
    [Theory]
    [InlineData("opiskelija@edu.xamk.fi")]
    [InlineData("opettaja@xamk.fi")]
    public async Task AuthenticateOrCreateUserAsync_WithSchoolEmail_ReturnsSuccess(string validEmail)
    {
        // Arrange (Sääntö 7): Käyttäjää ei vielä löydy tietokannasta
        _userRepository.GetByEmailAsync(Arg.Any<SchoolEmail>(), Arg.Any<CancellationToken>())
            .Returns((User?)null);

        // Act: Tunnistaudutaan kelvollisella oppilaitossähköpostilla
        Result<UserResponse> result = await _service.AuthenticateOrCreateUserAsync(validEmail, "Opiskelija");

        // Assert: Varmistetaan, että uusi käyttäjä luotiin ja tallennettiin tietokantaan
        Assert.True(result.IsSuccess);
        Assert.Equal(validEmail.ToLowerInvariant(), result.Value.Email);

        await _userRepository.Received(1).AddAsync(Arg.Any<User>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Varmistaa, että jos käyttäjä on käyttöestossa (bannattu), kirjautuminen estetään <see cref="ErrorType.Forbidden"/>-virheellä.
    /// </summary>
    [Fact]
    public async Task AuthenticateOrCreateUserAsync_WhenUserIsBanned_ReturnsForbidden()
    {
        // Arrange: Luodaan olemassa oleva käyttäjä, jolla on aktiivinen käyttöesto
        DateTimeOffset now = DateTimeOffset.UtcNow;
        _dateTimeProvider.UtcNow.Returns(now);

        User bannedUser = User.Create(
            UserId.New(),
            SchoolEmail.Create("banned.student@edu.xamk.fi"),
            "Bannattu Opiskelija",
            UserRole.User,
            now.AddDays(-10));
        bannedUser.Ban(now.AddHours(24), "Toistuva sääntörikkomus");

        _userRepository.GetByEmailAsync(Arg.Any<SchoolEmail>(), Arg.Any<CancellationToken>())
            .Returns(bannedUser);

        // Act: Yritetään kirjautua sisään bannatulla tilillä
        Result<UserResponse> result = await _service.AuthenticateOrCreateUserAsync("banned.student@edu.xamk.fi", "Bannattu Opiskelija");

        // Assert: Kirjautumisen tulee estyä Forbidden-virheellä
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Forbidden, result.Error.Type);
        Assert.Equal("User.Banned", result.Error.Code);
    }

    /// <summary>
    /// Varmistaa, että käyttäjälle voidaan asettaa määräaikainen käyttöesto valitulla tuntimäärällä ja syyllä.
    /// </summary>
    [Fact]
    public async Task UpdateUserBanAsync_WithDurationHours_BansUser()
    {
        // Arrange
        DateTimeOffset now = new DateTimeOffset(2026, 11, 2, 10, 0, 0, TimeSpan.Zero);
        _dateTimeProvider.UtcNow.Returns(now);

        UserId userId = UserId.New();
        User user = User.Create(userId, SchoolEmail.Create("student@edu.xamk.fi"), "Matti", UserRole.User, now.AddDays(-5));

        _userRepository.GetByIdAsync(userId, Arg.Any<CancellationToken>()).Returns(user);

        BanUserRequest request = new BanUserRequest(DurationHours: 48, Reason: "Epäasiallinen käytös");

        // Act
        Result<UserResponse> result = await _service.UpdateUserBanAsync(userId.Value, request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.True(result.Value.IsBanned);
        Assert.Equal("Epäasiallinen käytös", result.Value.BanReason);
        Assert.Equal(now.AddHours(48), result.Value.BannedUntilUtc);

        await _userRepository.Received(1).UpdateAsync(user, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Varmistaa, että käyttäjälle voidaan asettaa pysyvä käyttöesto (<c>IsPermanent = true</c>).
    /// </summary>
    [Fact]
    public async Task UpdateUserBanAsync_WithPermanent_SetsFarFutureBan()
    {
        // Arrange
        DateTimeOffset now = new DateTimeOffset(2026, 11, 2, 10, 0, 0, TimeSpan.Zero);
        _dateTimeProvider.UtcNow.Returns(now);

        UserId userId = UserId.New();
        User user = User.Create(userId, SchoolEmail.Create("cheater@edu.xamk.fi"), "Huijari", UserRole.User, now.AddDays(-1));

        _userRepository.GetByIdAsync(userId, Arg.Any<CancellationToken>()).Returns(user);

        BanUserRequest request = new BanUserRequest(DurationHours: null, Reason: "Vandalismi", IsPermanent: true);

        // Act
        Result<UserResponse> result = await _service.UpdateUserBanAsync(userId.Value, request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.True(result.Value.IsBanned);
        Assert.Equal(now.AddYears(100), result.Value.BannedUntilUtc);
    }

    /// <summary>
    /// Varmistaa, että nollakestoinen esto ilman pysyvää lippua poistaa käyttäjän voimassa olevan bannin.
    /// </summary>
    [Fact]
    public async Task UpdateUserBanAsync_WithZeroDuration_UnbansUser()
    {
        // Arrange
        DateTimeOffset now = new DateTimeOffset(2026, 11, 2, 10, 0, 0, TimeSpan.Zero);
        _dateTimeProvider.UtcNow.Returns(now);

        UserId userId = UserId.New();
        User user = User.Create(userId, SchoolEmail.Create("reformed@edu.xamk.fi"), "Parantunut", UserRole.User, now.AddDays(-30));
        user.Ban(now.AddDays(7), "Vanha banni");

        _userRepository.GetByIdAsync(userId, Arg.Any<CancellationToken>()).Returns(user);

        BanUserRequest request = new BanUserRequest(DurationHours: 0, Reason: null, IsPermanent: false);

        // Act
        Result<UserResponse> result = await _service.UpdateUserBanAsync(userId.Value, request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.False(result.Value.IsBanned);
        Assert.Null(result.Value.BannedUntilUtc);
        Assert.Null(result.Value.BanReason);
    }

    /// <summary>
    /// Varmistaa, että pääkäyttäjää (<see cref="UserRole.SuperAdmin"/>) ei voida asettaa käyttöestoon.
    /// </summary>
    [Fact]
    public async Task UpdateUserBanAsync_WhenTargetIsSuperAdmin_ReturnsValidationError()
    {
        // Arrange
        UserId superAdminId = UserId.New();
        User superAdmin = User.Create(superAdminId, SchoolEmail.Create("root@xamk.fi"), "Pääkäyttäjä", UserRole.SuperAdmin, DateTimeOffset.UtcNow);

        _userRepository.GetByIdAsync(superAdminId, Arg.Any<CancellationToken>()).Returns(superAdmin);

        BanUserRequest request = new BanUserRequest(DurationHours: 24, Reason: "Testi");

        // Act
        Result<UserResponse> result = await _service.UpdateUserBanAsync(superAdminId.Value, request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("User.CannotBanSuperAdmin", result.Error.Code);
        await _unitOfWork.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Varmistaa, että käyttäjän roolin päivittäminen tallentaa uuden roolin onnistuneesti.
    /// </summary>
    [Fact]
    public async Task UpdateUserRoleAsync_WhenUserExists_UpdatesRole()
    {
        // Arrange
        UserId userId = UserId.New();
        User user = User.Create(userId, SchoolEmail.Create("assistant@xamk.fi"), "Valvoja", UserRole.User, DateTimeOffset.UtcNow);

        _userRepository.GetByIdAsync(userId, Arg.Any<CancellationToken>()).Returns(user);

        // Act
        Result<UserResponse> result = await _service.UpdateUserRoleAsync(userId.Value, UserRole.Admin);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("Admin", result.Value.Role);
        Assert.Equal(UserRole.Admin, user.Role);
        await _userRepository.Received(1).UpdateAsync(user, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
