using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Application.Common;
using Pelihuone.Application.Issues;
using Pelihuone.Application.Notifications;
using Pelihuone.Contracts.Issues;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Tests;

/// <summary>
/// Yksikkötestit <see cref="IssueReportService"/>-palveluluokalle, joka käsittelee laite- ja vikailmoituksia sekä Discord-ilmoituksia.
/// </summary>
public class IssueReportServiceTests
{
    private readonly IIssueReportRepository _issueReportRepository = Substitute.For<IIssueReportRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();
    private readonly IDiscordNotificationService _discordNotificationService = Substitute.For<IDiscordNotificationService>();
    private readonly IssueReportService _service;

    /// <summary>
    /// Alustaa uuden <see cref="IssueReportServiceTests"/>-testiluokan kiinteällä testiajalla ja mock-riippuvuuksilla.
    /// </summary>
    public IssueReportServiceTests()
    {
        // Kiinnitetään nykyhetki deterministisiä testejä varten
        _dateTimeProvider.UtcNow.Returns(new DateTimeOffset(2026, 10, 20, 12, 0, 0, TimeSpan.Zero));

        _service = new IssueReportService(
            _issueReportRepository,
            _userRepository,
            _unitOfWork,
            _dateTimeProvider,
            _discordNotificationService,
            NullLogger<IssueReportService>.Instance);
    }

    /// <summary>
    /// Varmistaa, että kelvollisilla tiedoilla luotu vikailmoitus tallennetaan tietokantaan ja välitetään Discord-ilmoituspalvelulle.
    /// </summary>
    [Fact]
    public async Task CreateIssueReport_WithValidData_CreatesReportAndNotifiesDiscord()
    {
        // Arrange: Muodostetaan kelvollinen vikailmoituspyyntö
        var request = new CreateIssueReportRequest(
            "student@edu.xamk.fi",
            "Matti Meikäläinen",
            "PC 3",
            "Näyttö vilkkuu",
            "Näyttö sammuilee satunnaisesti pelatessa");

        // Act: Lähetetään vikailmoitus palvelulle
        var result = await _service.CreateIssueReportAsync(request);

        // Assert: Tarkistetaan tallennus, paluuarvon tila sekä Discord-webhookin kutsuminen
        Assert.True(result.IsSuccess);
        Assert.Equal("PC 3", result.Value.Target);
        Assert.Equal("Näyttö vilkkuu", result.Value.Title);
        Assert.False(result.Value.IsResolved);

        await _issueReportRepository.Received(1).AddAsync(Arg.Any<IssueReport>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        await _discordNotificationService.Received(1).SendIssueReportNotificationAsync(
            "PC 3",
            "Näyttö vilkkuu",
            "Näyttö sammuilee satunnaisesti pelatessa",
            "student@edu.xamk.fi",
            "Matti Meikäläinen",
            Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Varmistaa, että vikailmoituksen luominen epäonnistuu validointivirheeseen, jos kohdelaite puuttuu.
    /// </summary>
    [Fact]
    public async Task CreateIssueReport_WhenTargetIsMissing_ReturnsValidationFailure()
    {
        // Arrange: Luodaan puutteellinen pyyntö tyhjällä Target-arvolla
        var request = new CreateIssueReportRequest("student@edu.xamk.fi", "Matti", "", "Otsikko", "Kuvaus");

        // Act: Yritetään tallentaa virheellinen vikailmoitus
        var result = await _service.CreateIssueReportAsync(request);

        // Assert: Varmistetaan, että palautetaan validointivirhe
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorType.Validation, result.Error.Type);
    }

    /// <summary>
    /// Varmistaa, että Admin-käyttäjä voi merkitä avoimen vikailmoituksen ratkaistuksi muistiinpanojen kera.
    /// </summary>
    [Fact]
    public async Task ResolveIssueReport_WhenUserIsAdmin_ResolvesSuccessfully()
    {
        // Arrange: Alustetaan Admin-käyttäjä sekä avoin vikailmoitus
        var adminId = Guid.NewGuid();
        var adminUser = User.Create(new UserId(adminId), SchoolEmail.Create("admin@xamk.fi"), "Admin", UserRole.Admin, DateTimeOffset.UtcNow);
        _userRepository.GetByIdAsync(new UserId(adminId), Arg.Any<CancellationToken>()).Returns(adminUser);

        var report = IssueReport.Create(
            IssueReportId.New(),
            "student@edu.xamk.fi",
            "Matti",
            "PlayStation 5",
            "Ohjain rikki",
            "Vasen tatti driftaa",
            DateTimeOffset.UtcNow);

        _issueReportRepository.GetByIdAsync(report.Id, Arg.Any<CancellationToken>()).Returns(report);

        var resolveRequest = new ResolveIssueReportRequest("Ohjain vaihdettu uuteen.");

        // Act: Merkitään vikailmoitus ratkaistuksi ylläpitäjän toimesta
        var result = await _service.ResolveIssueReportAsync(report.Id.Value, resolveRequest, adminId);

        // Assert: Tarkistetaan, että tila päivittyi ratkaistuksi ja muistiinpanot tallentuivat
        Assert.True(result.IsSuccess);
        Assert.True(result.Value.IsResolved);
        Assert.Equal("Ohjain vaihdettu uuteen.", result.Value.AdminNotes);
        await _issueReportRepository.Received(1).UpdateAsync(report, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
