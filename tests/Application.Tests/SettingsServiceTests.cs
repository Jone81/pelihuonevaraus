using Microsoft.Extensions.Logging.Abstractions;
using Pelihuone.Application.Common;
using Pelihuone.Application.Settings;
using Pelihuone.Contracts.Settings;

namespace Pelihuone.Application.Tests;

/// <summary>
/// Yksikkötestit <see cref="SettingsService"/>-palveluluokalle ja varauskiintiöiden sekä aukioloaikojen validoinnille.
/// </summary>
public class SettingsServiceTests
{
    private readonly SettingsService _service;

    /// <summary>
    /// Alustaa uuden <see cref="SettingsServiceTests"/>-testiluokan.
    /// </summary>
    public SettingsServiceTests()
    {
        _service = new SettingsService(NullLogger<SettingsService>.Instance);
    }

    /// <summary>
    /// Varmistaa, että oletusasetusten noutaminen palauttaa onnistuneen tuloksen ja järkevät oletusarvot.
    /// </summary>
    [Fact]
    public async Task GetSettingsAsync_ReturnsValidSettings()
    {
        // Act
        Result<SiteSettingsResponse> result = await _service.GetSettingsAsync();

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.True(result.Value.OpenTimeHour < result.Value.CloseTimeHour);
        Assert.True(result.Value.MaxIndividualHours > 0);
        Assert.True(result.Value.MaxAdvanceBookingMonths > 0);
    }

    /// <summary>
    /// Varmistaa, että kelvolliset asetukset päivittyvät ja palautuvat päivitetyssä muodossa.
    /// </summary>
    [Fact]
    public async Task UpdateSettingsAsync_WithValidData_UpdatesSettings()
    {
        // Arrange
        UpdateSiteSettingsRequest request = new UpdateSiteSettingsRequest(
            DiscordWebhookUrl: "https://discord.com/api/webhooks/test",
            OpenTimeHour: 9,
            CloseTimeHour: 20,
            OnlyWeekdays: false,
            MaxAdvanceBookingMonths: 3,
            MaxIndividualHours: 5,
            MaxStudentRoomHours: 6,
            MinReservationMinutes: 60,
            EnforceSharedTvLock: false,
            IsMaintenanceMode: true,
            MaintenanceMessage: "Testihuolto");

        // Act
        Result<SiteSettingsResponse> result = await _service.UpdateSettingsAsync(request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(9, result.Value.OpenTimeHour);
        Assert.Equal(20, result.Value.CloseTimeHour);
        Assert.False(result.Value.OnlyWeekdays);
        Assert.Equal(3, result.Value.MaxAdvanceBookingMonths);
        Assert.Equal(5, result.Value.MaxIndividualHours);
        Assert.Equal(6, result.Value.MaxStudentRoomHours);
        Assert.Equal(60, result.Value.MinReservationMinutes);
        Assert.False(result.Value.EnforceSharedTvLock);
        Assert.True(result.Value.IsMaintenanceMode);
        Assert.Equal("Testihuolto", result.Value.MaintenanceMessage);
    }

    /// <summary>
    /// Varmistaa, että jos aukioloajan avaustunti on suurempi tai yhtä suuri kuin sulkemistunti, pyyntö hylätään validointivirheellä.
    /// </summary>
    [Fact]
    public async Task UpdateSettingsAsync_WhenOpenTimeGreaterThanOrEqualToCloseTime_ReturnsValidationError()
    {
        // Arrange: Avausaika klo 18 ja sulkemisaika klo 8
        UpdateSiteSettingsRequest request = new UpdateSiteSettingsRequest(
            OpenTimeHour: 18,
            CloseTimeHour: 8);

        // Act
        Result<SiteSettingsResponse> result = await _service.UpdateSettingsAsync(request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Validation, result.Error.Type);
        Assert.Equal("Settings.InvalidCloseHour", result.Error.Code);
    }

    /// <summary>
    /// Varmistaa, että virheellinen ennakkovarausikkuna (esim. 0 kuukautta) hylätään validointivirheellä.
    /// </summary>
    [Fact]
    public async Task UpdateSettingsAsync_WhenAdvanceMonthsZeroOrNegative_ReturnsValidationError()
    {
        // Arrange
        UpdateSiteSettingsRequest request = new UpdateSiteSettingsRequest(MaxAdvanceBookingMonths: 0);

        // Act
        Result<SiteSettingsResponse> result = await _service.UpdateSettingsAsync(request);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Validation, result.Error.Type);
        Assert.Equal("Settings.InvalidAdvanceMonths", result.Error.Code);
    }
}
