using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Application.Common;
using Pelihuone.Application.Users;
using Pelihuone.Application.Users.Validators;
using Pelihuone.Contracts.Users;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Tests;

/// <summary>
/// Yksikkötestit <see cref="UserService"/>-palveluluokalle ja oppilaitossähköpostien validoinnille.
/// </summary>
public class UserServiceTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();
    private readonly UserService _service;

    /// <summary>
    /// Alustaa uuden <see cref="UserServiceTests"/>-testiluokan ja luo testattavan käyttäjäpalvelun.
    /// </summary>
    public UserServiceTests()
    {
        // Asetetaan aikapalvelu palauttamaan nykyinen UTC-aika
        _dateTimeProvider.UtcNow.Returns(DateTimeOffset.UtcNow);

        _service = new UserService(
            _userRepository,
            _unitOfWork,
            _dateTimeProvider,
            new SchoolEmailValidator(),
            NullLogger<UserService>.Instance);
    }

    /// <summary>
    /// Varmistaa, että ulkopuolisilla sähköpostiosoitteilla kirjautuminen hylätään validointivirheellä (Sääntö 7).
    /// </summary>
    /// <param name="invalidEmail">Testattava ei-hyväksyttävä sähköpostiosoite.</param>
    [Theory]
    [InlineData("test@gmail.com")]
    [InlineData("user@hotmail.com")]
    [InlineData("someone@company.fi")]
    public async Task AuthenticateOrCreateUserAsync_WithNonSchoolEmail_ReturnsValidationError(string invalidEmail)
    {
        // Arrange & Act (Sääntö 7)
        Result<UserResponse> result = await _service.AuthenticateOrCreateUserAsync(invalidEmail, "Testaaja");

        // Assert: Ulkopuolisen sähköpostin tulee tuottaa User.InvalidEmail-validointivirhe
        Assert.True(result.IsFailure);
        Assert.Equal(ErrorType.Validation, result.Error.Type);
        Assert.Equal("User.InvalidEmail", result.Error.Code);
    }

    /// <summary>
    /// Varmistaa, että XAMK:n oppilaitossähköposteilla (<c>@edu.xamk.fi</c> ja <c>@xamk.fi</c>) kirjautuminen onnistuu ja luo uuden käyttäjän (Sääntö 7).
    /// </summary>
    /// <param name="validEmail">Testattava kelvollinen oppilaitossähköpostiosoite.</param>
    [Theory]
    [InlineData("opiskelija@edu.xamk.fi")]
    [InlineData("opettaja@xamk.fi")]
    public async Task AuthenticateOrCreateUserAsync_WithSchoolEmail_ReturnsSuccess(string validEmail)
    {
        // Arrange (Sääntö 7): Käyttäjää ei vielä löydy tietokannasta
        _userRepository.GetByEmailAsync(Arg.Any<SchoolEmail>(), Arg.Any<CancellationToken>())
            .Returns((User?)null);

        // Act: Tunnistaudutaan kelvollisella oppilaitossähköpostilla
        Result<UserResponse> result = await _service.AuthenticateOrCreateUserAsync(validEmail, "Opiskelija");

        // Assert: Varmistetaan, että uusi käyttäjä luotiin ja tallennettiin tietokantaan
        Assert.True(result.IsSuccess);
        Assert.Equal(validEmail.ToLowerInvariant(), result.Value.Email);

        await _userRepository.Received(1).AddAsync(Arg.Any<User>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
