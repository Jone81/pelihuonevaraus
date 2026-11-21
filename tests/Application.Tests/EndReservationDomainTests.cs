using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Tests;

/// <summary>
/// Domain-yksikkötestit varauksen kesken lopettamiselle (säännöt 1 ja 12: <see cref="TimeWindow.TruncateEnd"/> ja <see cref="Reservation.EndEarly"/>).
/// </summary>
public sealed class EndReservationDomainTests
{
    private static readonly DateTimeOffset BaseStartUtc = new DateTimeOffset(2026, 11, 2, 8, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset BaseEndUtc = new DateTimeOffset(2026, 11, 2, 10, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset BaseCreatedUtc = new DateTimeOffset(2026, 11, 2, 7, 0, 0, TimeSpan.Zero);

    private static Reservation CreateOngoingIndividualReservation(UserId ownerId)
    {
        TimeWindow timeWindow = TimeWindow.FromExact(BaseStartUtc, BaseEndUtc);
        return Reservation.CreateIndividual(
            ReservationId.New(),
            ownerId,
            GamingStationId.New(),
            timeWindow,
            BaseCreatedUtc);
    }

    /// <summary>
    /// Sääntö 1: Kelvollinen uusi päättymisaika palauttaa uuden katkaistun aikaikkunan muuttamatta alkuperäistä.
    /// </summary>
    [Fact]
    public void TruncateEnd_WithValidNewEndUtc_ReturnsTruncatedTimeWindowAndPreservesOriginal()
    {
        TimeWindow original = TimeWindow.FromExact(BaseStartUtc, BaseEndUtc);
        DateTimeOffset newEndUtc = BaseStartUtc.AddMinutes(45);

        TimeWindow truncated = original.TruncateEnd(newEndUtc);

        Assert.Equal(BaseStartUtc, truncated.StartUtc);
        Assert.Equal(newEndUtc, truncated.EndUtc);
        Assert.Equal(BaseEndUtc, original.EndUtc);
    }

    /// <summary>
    /// Sääntö 1: Uusi päättymisaika ennen alkamisaikaa tai tasan alkamisaikana heittää <see cref="DomainException"/>-poikkeuksen.
    /// </summary>
    [Theory]
    [InlineData(0)]
    [InlineData(-15)]
    public void TruncateEnd_WhenNewEndIsAtOrBeforeStart_ThrowsDomainException(int offsetMinutesFromStart)
    {
        TimeWindow original = TimeWindow.FromExact(BaseStartUtc, BaseEndUtc);
        DateTimeOffset invalidEndUtc = BaseStartUtc.AddMinutes(offsetMinutesFromStart);

        DomainException exception = Assert.Throws<DomainException>(() => original.TruncateEnd(invalidEndUtc));

        Assert.Equal("Uuden päättymisajan on oltava alkamisajan jälkeen.", exception.Message);
    }

    /// <summary>
    /// Sääntö 1: Uusi päättymisaika alkuperäisen päättymisajan kohdalla tai sen jälkeen heittää <see cref="DomainException"/>-poikkeuksen.
    /// </summary>
    [Theory]
    [InlineData(0)]
    [InlineData(30)]
    public void TruncateEnd_WhenNewEndIsAtOrAfterOriginalEnd_ThrowsDomainException(int offsetMinutesFromEnd)
    {
        TimeWindow original = TimeWindow.FromExact(BaseStartUtc, BaseEndUtc);
        DateTimeOffset invalidEndUtc = BaseEndUtc.AddMinutes(offsetMinutesFromEnd);

        DomainException exception = Assert.Throws<DomainException>(() => original.TruncateEnd(invalidEndUtc));

        Assert.Equal("Uuden päättymisajan on oltava ennen alkuperäistä päättymisaikaa.", exception.Message);
    }

    /// <summary>
    /// Sääntö 12 (K1): Omistaja voi lopettaa käynnissä olevan varauksen kesken, jolloin päättymisaika katkaistaan nykyhetkeen ja tila säilyy aktiivisena.
    /// </summary>
    [Fact]
    public void EndEarly_WhenOwnerEndsOngoingReservation_TruncatesEndTimeAndKeepsActive()
    {
        UserId ownerId = UserId.New();
        Reservation reservation = CreateOngoingIndividualReservation(ownerId);
        DateTimeOffset currentUtc = BaseStartUtc.AddMinutes(30);

        reservation.EndEarly(currentUtc, ownerId, UserRole.User);

        Assert.Equal(ReservationStatus.Active, reservation.Status);
        Assert.Equal(BaseStartUtc, reservation.TimeWindow.StartUtc);
        Assert.Equal(currentUtc, reservation.TimeWindow.EndUtc);
    }

    /// <summary>
    /// Sääntö 12 (K5): Admin voi lopettaa toisen käyttäjän käynnissä olevan varauksen kesken.
    /// </summary>
    [Fact]
    public void EndEarly_WhenAdminEndsOtherUsersReservation_TruncatesEndTimeAndKeepsActive()
    {
        UserId ownerId = UserId.New();
        UserId adminId = UserId.New();
        Reservation reservation = CreateOngoingIndividualReservation(ownerId);
        DateTimeOffset currentUtc = BaseStartUtc.AddHours(1);

        reservation.EndEarly(currentUtc, adminId, UserRole.Admin);

        Assert.Equal(ReservationStatus.Active, reservation.Status);
        Assert.Equal(currentUtc, reservation.TimeWindow.EndUtc);
    }

    /// <summary>
    /// Sääntö 12: SuperAdmin voi lopettaa toisen käyttäjän käynnissä olevan varauksen kesken.
    /// </summary>
    [Fact]
    public void EndEarly_WhenSuperAdminEndsOtherUsersReservation_TruncatesEndTimeAndKeepsActive()
    {
        UserId ownerId = UserId.New();
        UserId superAdminId = UserId.New();
        Reservation reservation = CreateOngoingIndividualReservation(ownerId);
        DateTimeOffset currentUtc = BaseStartUtc.AddHours(1);

        reservation.EndEarly(currentUtc, superAdminId, UserRole.SuperAdmin);

        Assert.Equal(ReservationStatus.Active, reservation.Status);
        Assert.Equal(currentUtc, reservation.TimeWindow.EndUtc);
    }

    /// <summary>
    /// Sääntö 12 (K2): Varausta ei voi lopettaa kesken ennen sen alkamista tai tasan alkamishetkellä.
    /// </summary>
    [Theory]
    [InlineData(-15)]
    [InlineData(0)]
    public void EndEarly_WhenReservationHasNotStarted_ThrowsDomainException(int offsetMinutesFromStart)
    {
        UserId ownerId = UserId.New();
        Reservation reservation = CreateOngoingIndividualReservation(ownerId);
        DateTimeOffset currentUtc = BaseStartUtc.AddMinutes(offsetMinutesFromStart);

        DomainException exception = Assert.Throws<DomainException>(
            () => reservation.EndEarly(currentUtc, ownerId, UserRole.User));

        Assert.Equal("Varausta ei voi lopettaa kesken ennen sen alkamista. Peruuta varaus sen sijaan.", exception.Message);
    }

    /// <summary>
    /// Sääntö 12 (K3): Jo päättynyttä varausta ei voi lopettaa kesken.
    /// </summary>
    [Theory]
    [InlineData(0)]
    [InlineData(10)]
    public void EndEarly_WhenReservationHasAlreadyEnded_ThrowsDomainException(int offsetMinutesFromEnd)
    {
        UserId ownerId = UserId.New();
        Reservation reservation = CreateOngoingIndividualReservation(ownerId);
        DateTimeOffset currentUtc = BaseEndUtc.AddMinutes(offsetMinutesFromEnd);

        DomainException exception = Assert.Throws<DomainException>(
            () => reservation.EndEarly(currentUtc, ownerId, UserRole.User));

        Assert.Equal("Varaus on jo päättynyt.", exception.Message);
    }

    /// <summary>
    /// Sääntö 12: Peruttua varausta ei voi lopettaa kesken.
    /// </summary>
    [Fact]
    public void EndEarly_WhenReservationIsCancelled_ThrowsDomainException()
    {
        UserId ownerId = UserId.New();
        Reservation reservation = CreateOngoingIndividualReservation(ownerId);
        reservation.Cancel(BaseStartUtc.AddMinutes(-30), ownerId, UserRole.User, "Peruttu");
        DateTimeOffset currentUtc = BaseStartUtc.AddMinutes(30);

        DomainException exception = Assert.Throws<DomainException>(
            () => reservation.EndEarly(currentUtc, ownerId, UserRole.User));

        Assert.Equal("Peruttua varausta ei voi lopettaa kesken.", exception.Message);
    }

    /// <summary>
    /// Sääntö 12 (K4): Toinen tavallinen käyttäjä ei voi lopettaa toisen käyttäjän varausta kesken.
    /// </summary>
    [Fact]
    public void EndEarly_WhenOtherUserTriesToEndReservation_ThrowsDomainException()
    {
        UserId ownerId = UserId.New();
        UserId otherUserId = UserId.New();
        Reservation reservation = CreateOngoingIndividualReservation(ownerId);
        DateTimeOffset currentUtc = BaseStartUtc.AddMinutes(30);

        DomainException exception = Assert.Throws<DomainException>(
            () => reservation.EndEarly(currentUtc, otherUserId, UserRole.User));

        Assert.Equal("Ei oikeutta lopettaa toisen käyttäjän varausta.", exception.Message);
    }
}
