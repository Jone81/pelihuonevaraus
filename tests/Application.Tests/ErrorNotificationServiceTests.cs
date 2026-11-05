using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Application.Notifications;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Tests;

/// <summary>
/// Yksikkötestit <see cref="ErrorNotificationService"/>-palveluluokalle ja virhehälytysten sähköpostilähetykselle.
/// </summary>
public class ErrorNotificationServiceTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IEmailSender _emailSender = Substitute.For<IEmailSender>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();
    private readonly IConfiguration _configuration = Substitute.For<IConfiguration>();
    private readonly ErrorNotificationService _service;

    /// <summary>
    /// Alustaa uuden <see cref="ErrorNotificationServiceTests"/>-testiluokan.
    /// </summary>
    public ErrorNotificationServiceTests()
    {
        _dateTimeProvider.UtcNow.Returns(new DateTimeOffset(2026, 11, 2, 12, 0, 0, TimeSpan.Zero));
        _configuration["Alerts:AdminEmail"].Returns("fallback-admin@xamk.fi");

        _service = new ErrorNotificationService(
            _userRepository,
            _emailSender,
            _dateTimeProvider,
            _configuration,
            NullLogger<ErrorNotificationService>.Instance);
    }

    /// <summary>
    /// Varmistaa, että virhehälytys lähetetään kaikille järjestelmän Admin- ja SuperAdmin-käyttäjille.
    /// </summary>
    [Fact]
    public async Task SendErrorAlertAsync_SendsEmailToAdminAndSuperAdminUsers()
    {
        // Arrange
        User admin = User.Create(UserId.New(), SchoolEmail.Create("admin1@xamk.fi"), "Admin Yksi", UserRole.Admin, DateTimeOffset.UtcNow);
        User superAdmin = User.Create(UserId.New(), SchoolEmail.Create("super@xamk.fi"), "Pääkäyttäjä", UserRole.SuperAdmin, DateTimeOffset.UtcNow);
        User student = User.Create(UserId.New(), SchoolEmail.Create("student@edu.xamk.fi"), "Opiskelija", UserRole.User, DateTimeOffset.UtcNow);

        _userRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns([admin, superAdmin, student]);

        _emailSender.SendEmailAsync(
            Arg.Any<IReadOnlyList<string>>(),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<bool>(),
            Arg.Any<CancellationToken>())
            .Returns(true);

        InvalidOperationException testException = new InvalidOperationException("Kriittinen tietokantavirhe!");

        // Act
        await _service.SendErrorAlertAsync(testException, "/api/reservations", "trace-12345");

        // Assert
        await _emailSender.Received(1).SendEmailAsync(
            Arg.Is<IReadOnlyList<string>>((IReadOnlyList<string> recipients) =>
                recipients.Contains("admin1@xamk.fi") &&
                recipients.Contains("super@xamk.fi") &&
                !recipients.Contains("student@edu.xamk.fi")),
            Arg.Is<string>((string subject) => subject.Contains("InvalidOperationException")),
            Arg.Is<string>((string body) => body.Contains("Kriittinen tietokantavirhe!") && body.Contains("trace-12345")),
            true,
            Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Varmistaa, että mikäli tietokantahaku epäonnistuu, virhehälytys lähetetään konfiguroidulle varasähköpostille.
    /// </summary>
    [Fact]
    public async Task SendErrorAlertAsync_WhenDatabaseFails_UsesFallbackEmail()
    {
        // Arrange: Tietokantahaku heittää poikkeuksen (esim. yhteys poikki)
        _userRepository.GetAllAsync(Arg.Any<CancellationToken>())
            .ThrowsAsync(new InvalidOperationException("Database connection timeout"));

        _emailSender.SendEmailAsync(
            Arg.Any<IReadOnlyList<string>>(),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<bool>(),
            Arg.Any<CancellationToken>())
            .Returns(true);

        InvalidOperationException crashException = new InvalidOperationException("Palvelin kaatui!");

        // Act
        await _service.SendErrorAlertAsync(crashException, "/api/critical");

        // Assert: Hälytys lähetetään silti varasähköpostiosoitteeseen
        await _emailSender.Received(1).SendEmailAsync(
            Arg.Is<IReadOnlyList<string>>((IReadOnlyList<string> r) => r.Contains("fallback-admin@xamk.fi")),
            Arg.Any<string>(),
            Arg.Any<string>(),
            true,
            Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Varmistaa, että sama virhe puskuroidaan spämmisuojan ansiosta eikä siitä lähetetä useita sähköposteja minuutin sisällä.
    /// </summary>
    [Fact]
    public async Task SendErrorAlertAsync_WhenSameExceptionRepeatedWithinCooldown_ThrottlesSubsequentCalls()
    {
        // Arrange
        User admin = User.Create(UserId.New(), SchoolEmail.Create("admin@xamk.fi"), "Admin", UserRole.Admin, DateTimeOffset.UtcNow);
        _userRepository.GetAllAsync(Arg.Any<CancellationToken>()).Returns([admin]);

        _emailSender.SendEmailAsync(
            Arg.Any<IReadOnlyList<string>>(),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<bool>(),
            Arg.Any<CancellationToken>())
            .Returns(true);

        InvalidOperationException repeatingException = new InvalidOperationException("Toistuva virhe loopissa");

        // Act: Kutsutaan kahdesti peräkkäin
        await _service.SendErrorAlertAsync(repeatingException, "/api/loop");
        await _service.SendErrorAlertAsync(repeatingException, "/api/loop");

        // Assert: Sähköposti lähetetään vain tasan kerran spämmisuojan ansiosta
        await _emailSender.Received(1).SendEmailAsync(
            Arg.Any<IReadOnlyList<string>>(),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<bool>(),
            Arg.Any<CancellationToken>());
    }
}
