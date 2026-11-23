using MediatR;
using Pelihuone.Application.Abstractions.Caching;
using Pelihuone.Application.Abstractions.Notifications;
using Pelihuone.Application.Abstractions.Services;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Reservations;

namespace Pelihuone.Application.Features.Reservations.Commands;

/// <summary>
/// Komento uuden varauksen (yksittäis-, tila- tai tapahtumavaraus) luomiseen.
/// </summary>
/// <param name="Request">Varauksen luontipyynnön tiedot.</param>
public sealed record CreateReservationCommand(CreateReservationRequest Request)
    : IRequest<Result<ReservationResponse>>;

/// <summary>
/// Käsittelijä <see cref="CreateReservationCommand"/>-komennolle.
/// </summary>
public sealed class CreateReservationCommandHandler
    : IRequestHandler<CreateReservationCommand, Result<ReservationResponse>>
{
    private readonly IReservationService _reservationService;
    private readonly ICacheService _cacheService;
    private readonly IRealtimeNotifier _realtimeNotifier;

    /// <summary>
    /// Alustaa uuden <see cref="CreateReservationCommandHandler"/>-instanssin.
    /// </summary>
    /// <param name="reservationService">Varauspalvelu liiketoimintasääntöjen ja tallennuksen suorittamiseen.</param>
    /// <param name="cacheService">Välimuistipalvelu tilastojen invalidoimiseen.</param>
    /// <param name="realtimeNotifier">Reaaliaikailmoitin varaustilanteen muutoksen välittämiseen.</param>
    public CreateReservationCommandHandler(
        IReservationService reservationService,
        ICacheService cacheService,
        IRealtimeNotifier realtimeNotifier)
    {
        _reservationService = reservationService;
        _cacheService = cacheService;
        _realtimeNotifier = realtimeNotifier;
    }

    /// <summary>
    /// Luo uuden varauksen, invalidoi tilastovälimuistin ja lähettää reaaliaikailmoituksen onnistuessaan.
    /// </summary>
    /// <param name="request">Varauksen luontikomento.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Luotu varaus tai virhetulos.</returns>
    public async Task<Result<ReservationResponse>> Handle(
        CreateReservationCommand request,
        CancellationToken cancellationToken)
    {
        Result<ReservationResponse> result = await _reservationService.CreateReservationAsync(
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
