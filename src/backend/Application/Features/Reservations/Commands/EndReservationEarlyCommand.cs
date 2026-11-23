using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Reservations;

namespace Pelihuone.Application.Features.Reservations.Commands;

/// <summary>
/// Komento käynnissä olevan varauksen lopettamiseen etuajassa.
/// </summary>
/// <param name="ReservationId">Lopetettavan varauksen tunniste.</param>
/// <param name="Request">Lopetuspyynnön tiedot.</param>
public sealed record EndReservationEarlyCommand(Guid ReservationId, EndReservationRequest Request)
    : IRequest<Result<ReservationResponse>>;

/// <summary>
/// Käsittelijä <see cref="EndReservationEarlyCommand"/>-komennolle.
/// </summary>
public sealed class EndReservationEarlyCommandHandler
    : IRequestHandler<EndReservationEarlyCommand, Result<ReservationResponse>>
{
    private readonly IReservationService _reservationService;
    private readonly ICacheService _cacheService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="EndReservationEarlyCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="reservationService">Varauspalvelu varauksen kesken lopettamiseen.</param>
    /// <param name="cacheService">Välimuistipalvelu tilastojen invalidoimiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin varaustilanteen muutoksen välittämiseen.</param>
    public EndReservationEarlyCommandHandler(
        IReservationService reservationService,
        ICacheService cacheService,
        IRealtimeNotifier realtimeNotifier)
    {
        _reservationService = reservationService;
        _cacheService = cacheService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Lopettaa käynnissä olevan varauksen etuajassa, invalidoi tilastovälimuistin ja lähettää reaaliaikailmoituksen onnistuessaan.
    /// </summary>
    /// <param name="request">Varauksen kesken lopettamisen komento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Päivitetyn varauksen tiedot tai virhetulos.</returns>
    public async Task<Result<ReservationResponse>> Handle(
        EndReservationEarlyCommand request,
        CancellationToken cancellationToken)
    {
        Result<ReservationResponse> result = await _reservationService.EndReservationEarlyAsync(
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
