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

public class IssueReportServiceTests
{
    private readonly IIssueReportRepository _issueReportRepository = Substitute.For<IIssueReportRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();
    private readonly IDiscordNotificationService _discordNotificationService = Substitute.For<IDiscordNotificationService>();
    private readonly IssueReportService _service;

    public IssueReportServiceTests()
    {
        _dateTimeProvider.UtcNow.Returns(new DateTimeOffset(2026, 10, 20, 12, 0, 0, TimeSpan.Zero));

        _service = new IssueReportService(
            _issueReportRepository,
            _userRepository,
            _unitOfWork,
            _dateTimeProvider,
            _discordNotificationService,
            NullLogger<IssueReportService>.Instance);
    }

    [Fact]
    public async Task CreateIssueReport_WithValidData_CreatesReportAndNotifiesDiscord()
    {
        // Arrange
        var request = new CreateIssueReportRequest(
            "student@edu.xamk.fi",
            "Matti Meikäläinen",
            "PC 3",
            "Näyttö vilkkuu",
            "Näyttö sammuilee satunnaisesti pelatessa");

        // Act
        var result = await _service.CreateIssueReportAsync(request);

        // Assert
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

    [Fact]
    public async Task CreateIssueReport_WhenTargetIsMissing_ReturnsValidationFailure()
    {
        // Arrange
        var request = new CreateIssueReportRequest("student@edu.xamk.fi", "Matti", "", "Otsikko", "Kuvaus");

        // Act
        var result = await _service.CreateIssueReportAsync(request);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(ErrorType.Validation, result.Error.Type);
    }

    [Fact]
    public async Task ResolveIssueReport_WhenUserIsAdmin_ResolvesSuccessfully()
    {
        // Arrange
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

        // Act
        var result = await _service.ResolveIssueReportAsync(report.Id.Value, resolveRequest, adminId);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.True(result.Value.IsResolved);
        Assert.Equal("Ohjain vaihdettu uuteen.", result.Value.AdminNotes);
        await _issueReportRepository.Received(1).UpdateAsync(report, Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
