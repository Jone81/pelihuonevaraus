using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Contracts.Reservations;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.WebApi.Tests;

/// <summary>
/// Integraatiotestit käynnissä olevan varauksen ennenaikaiselle lopettamispäätepisteelle
/// (<c>POST /api/reservations/{id}/end</c>).
/// </summary>
public class EndReservationEndpointsTests : IClassFixture<TestWebApplicationFactory>, IDisposable
{
    private static readonly DateTimeOffset FixedNowUtc = new DateTimeOffset(2026, 11, 16, 10, 15, 0, TimeSpan.FromHours(2)).ToUniversalTime();
    private static readonly DateTimeOffset BaseDayMorning = new DateTimeOffset(2026, 11, 16, 8, 0, 0, TimeSpan.FromHours(2));

    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    /// <summary>
    /// Alustaa uuden <see cref="EndReservationEndpointsTests"/>-testiluokan kiinteällä kellolla
    /// (klo 10:15 Suomen aikaa) ja luo HTTP-asiakkaan testisovellukseen.
    /// </summary>
    /// <param name="baseFactory">Perustestisovelluksen tehdasluokka.</param>
    public EndReservationEndpointsTests(TestWebApplicationFactory baseFactory)
    {
        _factory = baseFactory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IDateTimeProvider>();
                services.AddSingleton<IDateTimeProvider>(new FixedDateTimeProvider(FixedNowUtc));
            });
        });
        _client = _factory.CreateClient();
    }

    /// <summary>
    /// Vapauttaa testiluokan varaamat HTTP-asiakas- ja tehdasresurssit.
    /// </summary>
    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Varmistaa, että käynnissä olevan aktiivisen varauksen lopettaminen kesken omistajan toimesta
    /// palauttaa HTTP 200 OK ja päivitetyn <see cref="ReservationResponse"/>-vastauksen.
    /// </summary>
    [Fact]
    public async Task EndReservationEarly_WhenReservationIsInProgress_Returns200OkAndUpdatedReservation()
    {
        // Arrange: Luodaan käyttäjä, pelipiste ja käynnissä oleva varaus (09:00–12:00, kello on 10:15)
        UserId ownerId = new UserId(Guid.NewGuid());
        ReservationId reservationId = ReservationId.New();

        using (IServiceScope scope = _factory.Services.CreateScope())
        {
            ApplicationDbContext db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            User owner = User.Create(
                ownerId,
                SchoolEmail.Create($"lopettaja-{Guid.NewGuid():N}@edu.xamk.fi"),
                "Lopettaja",
                UserRole.User,
                BaseDayMorning);

            GamingStation station = GamingStation.Create(
                new GamingStationId(Guid.NewGuid()),
                "PC End-200",
                GamingStationType.PC);

            TimeWindow window = TimeWindow.Create(
                BaseDayMorning.AddHours(1), // 09:00
                BaseDayMorning.AddHours(4), // 12:00
                ReservationType.Individual,
                BaseDayMorning);

            Reservation reservation = Reservation.CreateIndividual(
                reservationId,
                owner.Id,
                station.Id,
                window,
                BaseDayMorning);

            await db.Users.AddAsync(owner);
            await db.GamingStations.AddAsync(station);
            await db.Reservations.AddAsync(reservation);
            await db.SaveChangesAsync();
        }

        EndReservationRequest request = new EndReservationRequest(ownerId.Value);

        // Act: Lopetetaan varaus kesken nykyhetkeen (klo 10:15)
        HttpResponseMessage response = await _client.PostAsJsonAsync($"/api/reservations/{reservationId.Value}/end", request);

        // Assert: Varmistetaan 200 OK sekä päivitetty päättymisaika ja tila
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        ReservationResponse? body = await response.Content.ReadFromJsonAsync<ReservationResponse>();
        Assert.NotNull(body);
        Assert.Equal(reservationId.Value, body.Id);
        Assert.Equal(ownerId.Value, body.UserId);
        Assert.Equal(FixedNowUtc, body.EndUtc);
        Assert.Equal(nameof(ReservationStatus.Active), body.Status);
    }

    /// <summary>
    /// Varmistaa, että olemattoman varauksen kesken lopettaminen palauttaa HTTP 404 Not Found ja ProblemDetails-vastauksen.
    /// </summary>
    [Fact]
    public async Task EndReservationEarly_WhenReservationDoesNotExist_Returns404NotFoundProblemDetails()
    {
        // Arrange: Käytetään satunnaista tunnistetta, jota ei ole tietokannassa
        Guid missingReservationId = Guid.NewGuid();
        EndReservationRequest request = new EndReservationRequest(Guid.NewGuid());

        // Act: Yritetään lopettaa olematon varaus
        HttpResponseMessage response = await _client.PostAsJsonAsync($"/api/reservations/{missingReservationId}/end", request);

        // Assert: Varmistetaan 404 Not Found ja ProblemDetails-rakenne
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        ProblemDetails? problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(404, problem.Status);
    }

    /// <summary>
    /// Varmistaa, että toisen käyttäjän käynnissä olevan varauksen lopetusyritys palauttaa
    /// HTTP 403 Forbidden ja ProblemDetails-vastauksen.
    /// </summary>
    [Fact]
    public async Task EndReservationEarly_WhenCallerIsAnotherUser_Returns403ForbiddenProblemDetails()
    {
        // Arrange: Luodaan omistaja, toinen opiskelija ja käynnissä oleva varaus
        UserId ownerId = new UserId(Guid.NewGuid());
        UserId otherUserId = new UserId(Guid.NewGuid());
        ReservationId reservationId = ReservationId.New();

        using (IServiceScope scope = _factory.Services.CreateScope())
        {
            ApplicationDbContext db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            User owner = User.Create(
                ownerId,
                SchoolEmail.Create($"omistaja-{Guid.NewGuid():N}@edu.xamk.fi"),
                "Omistaja",
                UserRole.User,
                BaseDayMorning);

            User otherUser = User.Create(
                otherUserId,
                SchoolEmail.Create($"toinen-{Guid.NewGuid():N}@edu.xamk.fi"),
                "Toinen Opiskelija",
                UserRole.User,
                BaseDayMorning);

            GamingStation station = GamingStation.Create(
                new GamingStationId(Guid.NewGuid()),
                "PC End-403",
                GamingStationType.PC);

            TimeWindow window = TimeWindow.Create(
                BaseDayMorning.AddHours(1), // 09:00
                BaseDayMorning.AddHours(4), // 12:00
                ReservationType.Individual,
                BaseDayMorning);

            Reservation reservation = Reservation.CreateIndividual(
                reservationId,
                owner.Id,
                station.Id,
                window,
                BaseDayMorning);

            await db.Users.AddAsync(owner);
            await db.Users.AddAsync(otherUser);
            await db.GamingStations.AddAsync(station);
            await db.Reservations.AddAsync(reservation);
            await db.SaveChangesAsync();
        }

        EndReservationRequest request = new EndReservationRequest(otherUserId.Value);

        // Act: Toinen käyttäjä yrittää lopettaa omistajan käynnissä olevan varauksen
        HttpResponseMessage response = await _client.PostAsJsonAsync($"/api/reservations/{reservationId.Value}/end", request);

        // Assert: Varmistetaan 403 Forbidden ja ProblemDetails-rakenne
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        ProblemDetails? problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(403, problem.Status);
    }

    /// <summary>
    /// Varmistaa, että vielä alkamattoman (tulevan) varauksen kesken lopettaminen palauttaa
    /// HTTP 409 Conflict ja ProblemDetails-vastauksen.
    /// </summary>
    [Fact]
    public async Task EndReservationEarly_WhenReservationHasNotStartedYet_Returns409ConflictProblemDetails()
    {
        // Arrange: Luodaan käyttäjä, pelipiste ja tuleva varaus (11:00–13:00, kello on 10:15)
        UserId ownerId = new UserId(Guid.NewGuid());
        ReservationId reservationId = ReservationId.New();

        using (IServiceScope scope = _factory.Services.CreateScope())
        {
            ApplicationDbContext db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            User owner = User.Create(
                ownerId,
                SchoolEmail.Create($"tuleva-{Guid.NewGuid():N}@edu.xamk.fi"),
                "Tuleva Varaaja",
                UserRole.User,
                BaseDayMorning);

            GamingStation station = GamingStation.Create(
                new GamingStationId(Guid.NewGuid()),
                "PC End-409",
                GamingStationType.PC);

            TimeWindow window = TimeWindow.Create(
                BaseDayMorning.AddHours(3), // 11:00
                BaseDayMorning.AddHours(5), // 13:00
                ReservationType.Individual,
                BaseDayMorning);

            Reservation reservation = Reservation.CreateIndividual(
                reservationId,
                owner.Id,
                station.Id,
                window,
                BaseDayMorning);

            await db.Users.AddAsync(owner);
            await db.GamingStations.AddAsync(station);
            await db.Reservations.AddAsync(reservation);
            await db.SaveChangesAsync();
        }

        EndReservationRequest request = new EndReservationRequest(ownerId.Value);

        // Act: Yritetään lopettaa kesken varaus, joka ei ole vielä alkanut
        HttpResponseMessage response = await _client.PostAsJsonAsync($"/api/reservations/{reservationId.Value}/end", request);

        // Assert: Varmistetaan 409 Conflict ja ProblemDetails-rakenne
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        ProblemDetails? problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(409, problem.Status);
    }

    private sealed class FixedDateTimeProvider : IDateTimeProvider
    {
        public FixedDateTimeProvider(DateTimeOffset utcNow)
        {
            UtcNow = utcNow;
        }

        public DateTimeOffset UtcNow { get; }
    }
}
