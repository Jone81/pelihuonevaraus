using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Reservations;

namespace Pelihuone.Application.Features.Reservations.Commands;

/// <summary>
/// Komento olemassa olevan varauksen perumiseen.
/// </summary>
/// <param name="ReservationId">Peruttavan varauksen tunniste.</param>
/// <param name="Request">Perumispyynnön tiedot.</param>
public sealed record CancelReservationCommand(Guid ReservationId, CancelReservationRequest Request)
    : IRequest<Result<ReservationResponse>>;

/// <summary>
/// Käsittelijä <see cref="CancelReservationCommand"/>-komennolle.
/// </summary>
public sealed class CancelReservationCommandHandler
    : IRequestHandler<CancelReservationCommand, Result<ReservationResponse>>
{
    private readonly IReservationService _reservationService;
    private readonly ICacheService _cacheService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="CancelReservationCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="reservationService">Varauspalvelu varauksen perumiseen.</param>
    /// <param name="cacheService">Välimuistipalvelu tilastojen invalidoimiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin varaustilanteen muutoksen välittämiseen.</param>
    public CancelReservationCommandHandler(
        IReservationService reservationService,
        ICacheService cacheService,
        IRealtimeNotifier realtimeNotifier)
    {
        _reservationService = reservationService;
        _cacheService = cacheService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Peruu varauksen, invalidoi tilastovälimuistin ja lähettää reaaliaikailmoituksen onnistuessaan.
    /// </summary>
    /// <param name="request">Varauksen perumiskomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Perutun varauksen tiedot tai virhetulos.</returns>
    public async Task<Result<ReservationResponse>> Handle(
        CancelReservationCommand request,
        CancellationToken cancellationToken)
    {
        Result<ReservationResponse> result = await _reservationService.CancelReservationAsync(
            request.ReservationId,
            request.Request,
            cancellationToken);

        if (result.IsSuccess)
        {
            await _cacheService.RemoveByTagAsync(CacheTags.Statistics, cancellationToken);
            await _realtimeNotifier.NotifyReservationChangedAsync(cancellationToken);
        }

        return result;
    }
}
