using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Statistics;
using Pelihuone.Domain.Enums;

namespace Pelihuone.Application.Statistics;

public sealed class StatisticsService : IStatisticsService
{
    private readonly IReservationRepository _reservationRepository;
    private readonly IGamingStationRepository _stationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IGameRepository _gameRepository;

    public StatisticsService(
        IReservationRepository reservationRepository,
        IGamingStationRepository stationRepository,
        IUserRepository userRepository,
        IGameRepository gameRepository)
    {
        _reservationRepository = reservationRepository;
        _stationRepository = stationRepository;
        _userRepository = userRepository;
        _gameRepository = gameRepository;
    }

    public async Task<Result<StatisticsResponse>> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var reservations = await _reservationRepository.GetAllAsync(cancellationToken);
        var stations = await _stationRepository.GetAllActiveAsync(cancellationToken);
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var games = await _gameRepository.GetAllAsync(cancellationToken);

        int total = reservations.Count;
        int active = reservations.Count(r => r.Status == ReservationStatus.Active);
        int cancelled = reservations.Count(r => r.Status == ReservationStatus.Cancelled);

        var stationStats = new List<StationUsageStat>();
        foreach (var station in stations)
        {
            var stationRes = reservations.Where(r => r.GamingStationId == station.Id).ToList();
            int count = stationRes.Count;
            double hours = stationRes.Sum(r => r.TimeWindow.Duration.TotalHours);

            stationStats.Add(new StationUsageStat(
                station.Id.Value,
                station.Name,
                station.Type.ToString(),
                count,
                Math.Round(hours, 1)));
        }

        var typeStats = new List<ReservationTypeStat>
        {
            new("Individual", reservations.Count(r => r.Type == ReservationType.Individual)),
            new("Room", reservations.Count(r => r.Type == ReservationType.Room)),
            new("Event", reservations.Count(r => r.Type == ReservationType.Event))
        };

        var response = new StatisticsResponse(
            TotalReservations: total,
            ActiveReservations: active,
            CancelledReservations: cancelled,
            TotalUsers: users.Count,
            TotalGames: games.Count(g => !g.IsWishlist),
            WishlistGamesCount: games.Count(g => g.IsWishlist),
            StationUsage: stationStats.OrderByDescending(s => s.ReservationCount).ToList(),
            TypeBreakdown: typeStats);

        return Result.Success(response);
    }
}
