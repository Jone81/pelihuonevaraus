using NSubstitute;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Application.Features.Reservations.Commands;
using Pelihuone.Application.Features.Stations.Commands;
using Pelihuone.Contracts.GamingStations;
using Pelihuone.Contracts.Reservations;

namespace Pelihuone.Application.Tests.Behaviors;

/// <summary>
/// Yksikkötestit CQRS-komentokäsittelijöiden välimuistin invalidoinnille ja reaaliaikailmoituksille.
/// </summary>
public sealed class CommandHandlerSideEffectsTests
{
    /// <summary>
    /// Varmistaa, että onnistunut <see cref="CreateReservationCommand"/> invalidoi tilastovälimuistin
    /// ja lähettää reaaliaikaisen ilmoituksen varaustilanteen muutoksesta.
    /// </summary>
    [Fact]
    public async Task CreateReservationCommandHandler_OnSuccess_InvalidatesStatisticsAndNotifies()
    {
        IReservationService reservationService = Substitute.For<IReservationService>();
        ICacheService cacheService = Substitute.For<ICacheService>();
        IRealtimeNotifier realtimeNotifier = Substitute.For<IRealtimeNotifier>();

        Guid userId = Guid.NewGuid();
        Guid stationId = Guid.NewGuid();
        DateTimeOffset startUtc = new(2026, 11, 23, 14, 0, 0, TimeSpan.Zero);
        DateTimeOffset endUtc = startUtc.AddHours(1);
        CreateReservationRequest request = new("idem-1", userId, 1, stationId, startUtc, endUtc);
        ReservationResponse response = new(
            Guid.NewGuid(),
            userId,
            "Individual",
            stationId,
            startUtc,
            endUtc,
            60,
            "Active",
            startUtc,
            null);

        reservationService
            .CreateReservationAsync(request, Arg.Any<CancellationToken>())
            .Returns(Result.Success(response));

        CreateReservationCommandHandler handler = new(reservationService, cacheService, realtimeNotifier);

        Result<ReservationResponse> result = await handler.Handle(
            new CreateReservationCommand(request),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        await cacheService.Received(1).RemoveByTagAsync(CacheTags.Statistics, CancellationToken.None);
        await realtimeNotifier.Received(1).NotifyReservationChangedAsync(CancellationToken.None);
    }

    /// <summary>
    /// Varmistaa, että epäonnistunut <see cref="CreateReservationCommand"/> ei invalidoi välimuistia
    /// eikä lähetä turhaa reaaliaikailmoitusta.
    /// </summary>
    [Fact]
    public async Task CreateReservationCommandHandler_OnFailure_DoesNotInvalidateOrNotify()
    {
        IReservationService reservationService = Substitute.For<IReservationService>();
        ICacheService cacheService = Substitute.For<ICacheService>();
        IRealtimeNotifier realtimeNotifier = Substitute.For<IRealtimeNotifier>();

        DateTimeOffset startUtc = new(2026, 11, 23, 14, 0, 0, TimeSpan.Zero);
        CreateReservationRequest request = new("idem-2", Guid.NewGuid(), 1, Guid.NewGuid(), startUtc, startUtc.AddHours(1));
        Error conflictError = Error.Conflict("Reservation.Overlap", "Aikaväli on jo varattu.");

        reservationService
            .CreateReservationAsync(request, Arg.Any<CancellationToken>())
            .Returns(Result.Failure<ReservationResponse>(conflictError));

        CreateReservationCommandHandler handler = new(reservationService, cacheService, realtimeNotifier);

        Result<ReservationResponse> result = await handler.Handle(
            new CreateReservationCommand(request),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        await cacheService.DidNotReceive().RemoveByTagAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
        await realtimeNotifier.DidNotReceive().NotifyReservationChangedAsync(Arg.Any<CancellationToken>());
    }

    /// <summary>
    /// Varmistaa, että onnistunut <see cref="UpdateStationStatusCommand"/> invalidoi pelipistevälimuistin
    /// ja lähettää reaaliaikaisen ilmoituksen pelipisteen tilamuutoksesta.
    /// </summary>
    [Fact]
    public async Task UpdateStationStatusCommandHandler_OnSuccess_InvalidatesStationsAndNotifies()
    {
        IGamingStationService stationService = Substitute.For<IGamingStationService>();
        ICacheService cacheService = Substitute.For<ICacheService>();
        IRealtimeNotifier realtimeNotifier = Substitute.For<IRealtimeNotifier>();

        Guid stationId = Guid.NewGuid();
        UpdateGamingStationStatusRequest request = new(false, "PC 1 (Huollossa)");
        GamingStationResponse response = new(stationId, "PC 1 (Huollossa)", "PC", false, false);

        stationService
            .UpdateStationStatusAsync(stationId, request, Arg.Any<CancellationToken>())
            .Returns(Result.Success(response));

        UpdateStationStatusCommandHandler handler = new(stationService, cacheService, realtimeNotifier);

        Result<GamingStationResponse> result = await handler.Handle(
            new UpdateStationStatusCommand(stationId, request),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        await cacheService.Received(1).RemoveByTagAsync(CacheTags.Stations, CancellationToken.None);
        await realtimeNotifier.Received(1).NotifyStationStatusChangedAsync(CancellationToken.None);
    }
}
