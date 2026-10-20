using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Pelihuone.Contracts.Reservations;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;
using Xunit;

namespace Pelihuone.Integration.Tests;

public class ConcurrentBookingStressTests : IClassFixture<PostgreSqlTestcontainersFixture>
{
    private readonly PostgreSqlTestcontainersFixture _fixture;

    public ConcurrentBookingStressTests(PostgreSqlTestcontainersFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task ConcurrentBooking_With10SimultaneousRequests_ExactlyOneSucceedsAndNineFailWith409Conflict()
    {
        if (!_fixture.IsDockerAvailable || _fixture.Container is null)
        {
            // Host-koneella ei ole Docker-palvelua käynnissä (ohitetaan Testcontainers-ajo)
            return;
        }

        // Arrange: Alustetaan tietokanta oikeassa PostgreSQL-kontissa
        using var factory = new IntegrationTestFactory(_fixture.Container.GetConnectionString());
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Database.EnsureCreatedAsync();

            var user = User.Create(
                new UserId(Guid.NewGuid()),
                SchoolEmail.Create("stress.test@edu.xamk.fi"),
                "Stress Tester",
                UserRole.User,
                DateTimeOffset.UtcNow);

            var station = GamingStation.Create(
                new GamingStationId(Guid.NewGuid()),
                "PC Stress 1",
                GamingStationType.PC);

            await db.Users.AddAsync(user);
            await db.GamingStations.AddAsync(station);
            await db.SaveChangesAsync();

            var client = factory.CreateClient();

            var baseDate = new DateTimeOffset(2026, 11, 20, 8, 0, 0, TimeSpan.FromHours(2));
            var startUtc = baseDate.AddHours(2);
            var endUtc = baseDate.AddHours(4);

            // Valmistellaan 10 rinnakkaista pyyntöä täsmälleen samaan aikaväliin eri IdempotencyKey-tunnisteilla
            var requests = Enumerable.Range(1, 10).Select(i => new CreateReservationRequest(
                $"stress-idem-key-{i}",
                user.Id.Value,
                (int)ReservationType.Individual,
                station.Id.Value,
                startUtc,
                endUtc)).ToList();

            // Act: Ammutaan kaikki 10 pyyntöä samanaikaisesti Task.WhenAll-kutsulla
            var tasks = requests.Select(req => client.PostAsJsonAsync("/api/reservations", req));
            var responses = await Task.WhenAll(tasks);

            // Assert: Tasan 1 palauttaa 201 Created ja loput 9 palauttavat 409 Conflict
            int createdCount = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
            int conflictCount = responses.Count(r => r.StatusCode == HttpStatusCode.Conflict);

            Assert.Equal(1, createdCount);
            Assert.Equal(9, conflictCount);
        }
    }
}
