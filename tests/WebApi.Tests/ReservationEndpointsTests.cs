using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Pelihuone.Contracts.Reservations;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.WebApi.Tests;

public class ReservationEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public ReservationEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateReservation_WithInvalidTimes_Returns400BadRequestProblemDetails()
    {
        // Arrange
        var now = DateTimeOffset.UtcNow;
        var request = new CreateReservationRequest(
            "test-idem-key",
            Guid.NewGuid(),
            (int)ReservationType.Individual,
            Guid.NewGuid(),
            now.AddHours(2),
            now.AddHours(1)); // Start > End virhe

        // Act
        var response = await _client.PostAsJsonAsync("/api/reservations", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(400, problem.Status);
    }

    [Fact]
    public async Task CreateReservation_WhenStationAlreadyBooked_Returns409ConflictProblemDetails()
    {
        // Arrange: Luodaan ensin käyttäjä ja pelipiste tietokantaan
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var user = User.Create(
                new UserId(Guid.NewGuid()),
                SchoolEmail.Create("varaaja@edu.xamk.fi"),
                "Varaaja",
                UserRole.User,
                DateTimeOffset.UtcNow);

            var station = GamingStation.Create(
                new GamingStationId(Guid.NewGuid()),
                "PC A1",
                GamingStationType.PC);

            var baseTime = new DateTimeOffset(2026, 11, 15, 8, 0, 0, TimeSpan.FromHours(2));
            var window = TimeWindow.Create(
                baseTime.AddHours(2), // 10:00
                baseTime.AddHours(4), // 12:00
                ReservationType.Individual,
                baseTime);

            var existing = Reservation.CreateIndividual(
                ReservationId.New(),
                user.Id,
                station.Id,
                window,
                baseTime);

            await db.Users.AddAsync(user);
            await db.GamingStations.AddAsync(station);
            await db.Reservations.AddAsync(existing);
            await db.SaveChangesAsync();

            // Tehdään päällekkäinen varauspyyntö samalle laitteelle
            var request = new CreateReservationRequest(
                "conflict-test-key",
                user.Id.Value,
                (int)ReservationType.Individual,
                station.Id.Value,
                baseTime.AddHours(3), // 11:00 - 13:00 (päällekkäinen)
                baseTime.AddHours(5));

            // Act
            var response = await _client.PostAsJsonAsync("/api/reservations", request);

            // Assert
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
            Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

            var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
            Assert.NotNull(problem);
            Assert.Equal(409, problem.Status);
            Assert.Equal("Ristiriita", problem.Title);
        }
    }
}
