using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Statistics;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;

namespace Pelihuone.Application.Statistics;

/// <summary>
/// Toteuttaa pelihuoneen käyttötilastojen ja raporttien laskentalogiikan.
/// </summary>
public sealed class StatisticsService : IStatisticsService
{
    private readonly IReservationRepository _reservationRepository;
    private readonly IGamingStationRepository _stationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IGameRepository _gameRepository;

    /// <summary>
    /// Alustaa uuden <see cref="StatisticsService"/>-instanssin.
    /// </summary>
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

    /// <summary>
    /// Koostaa tilastoyhteenvedon kaikista varauksista, pelipisteiden käyttötunneista, käyttäjistä ja pelivalikoimasta.
    /// </summary>
    public async Task<Result<StatisticsResponse>> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        // Haetaan raakadata tietovarastoista tilastolaskentaa varten
        IReadOnlyList<Reservation> reservations = await _reservationRepository.GetAllAsync(cancellationToken);
        IReadOnlyList<GamingStation> stations = await _stationRepository.GetAllActiveAsync(cancellationToken);
        IReadOnlyList<User> users = await _userRepository.GetAllAsync(cancellationToken);
        IReadOnlyList<Game> games = await _gameRepository.GetAllAsync(cancellationToken);

        // Lasketaan varausten kokonaismäärät tilan mukaan
        int total = reservations.Count;
        int active = reservations.Count(r => r.Status == ReservationStatus.Active);
        int cancelled = reservations.Count(r => r.Status == ReservationStatus.Cancelled);

        // Lasketaan pelipistekohtaiset varausmäärät ja kokonaistunnit
        List<StationUsageStat> stationStats = new List<StationUsageStat>();
        foreach (GamingStation station in stations)
        {
            List<Reservation> stationRes = reservations.Where(r => r.GamingStationId == station.Id).ToList();
            int count = stationRes.Count;
            double hours = stationRes.Sum(r => r.TimeWindow.Duration.TotalHours);

            stationStats.Add(new StationUsageStat(
                station.Id.Value,
                station.Name,
                station.Type.ToString(),
                count,
                Math.Round(hours, 1)));
        }

        // Jaotellaan varaukset varaustyypin mukaan
        List<ReservationTypeStat> typeStats = new List<ReservationTypeStat>
        {
            new("Individual", reservations.Count(r => r.Type == ReservationType.Individual)),
            new("Room", reservations.Count(r => r.Type == ReservationType.Room)),
            new("Event", reservations.Count(r => r.Type == ReservationType.Event))
        };

        // Koostetaan lopullinen tilastovastaus järjestettynä suosituimman pelipisteen mukaan
        StatisticsResponse response = new StatisticsResponse(
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
