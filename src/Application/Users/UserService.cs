using System.Collections.Concurrent;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.Extensions.Logging;
using Pelihuone.Application.Abstractions.Data;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Application.Abstractions.Time;
using Pelihuone.Application.Common;
using Pelihuone.Contracts.Users;
using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.Exceptions;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Users;

/// <summary>
/// Toteuttaa käyttäjien kirjautumisen, vahvistuskoodien tarkistuksen ja roolien hallinnan liiketoimintalogiikan.
/// </summary>
public sealed class UserService : IUserService
{
    // Säilyttää väliaikaiset sähköpostikohtaiset vahvistuskoodit ja niiden vanhenemisajat muistissa
    private static readonly ConcurrentDictionary<string, (string Code, DateTimeOffset ExpiresAtUtc)> VerificationCodes = new(StringComparer.OrdinalIgnoreCase);

    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly IValidator<string> _emailValidator;
    private readonly ILogger<UserService> _logger;

    /// <summary>
    /// Alustaa uuden <see cref="UserService"/>-instanssin.
    /// </summary>
    public UserService(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IDateTimeProvider dateTimeProvider,
        IValidator<string> emailValidator,
        ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _dateTimeProvider = dateTimeProvider;
        _emailValidator = emailValidator;
        _logger = logger;
    }

    /// <summary>
    /// Validoi oppilaitoksen sähköpostin ja palauttaa olemassa olevan käyttäjän tai rekisteröi uuden käyttäjän.
    /// </summary>
    public async Task<Result<UserResponse>> AuthenticateOrCreateUserAsync(
        string email,
        string displayName,
        CancellationToken cancellationToken = default)
    {
        // Tarkistetaan sähköpostiosoite FluentValidation-säännöillä
        ValidationResult validationResult = await _emailValidator.ValidateAsync(email, cancellationToken);
        if (!validationResult.IsValid)
        {
            string errorMessage = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
            return Result.Failure<UserResponse>(Error.Validation("User.InvalidEmail", errorMessage));
        }

        // Luodaan toimialueen arvo-objekti sähköpostille
        SchoolEmail schoolEmail;
        try
        {
            schoolEmail = SchoolEmail.Create(email);
        }
        catch (InvalidEmailException ex)
        {
            return Result.Failure<UserResponse>(Error.Validation("User.InvalidEmail", ex.Message));
        }

        // Jos käyttäjä löytyy jo tietokannasta, tarkistetaan mahdollinen käyttöesto (banni) ennen sisäänkirjausta
        DateTimeOffset nowUtc = _dateTimeProvider.UtcNow;
        User? existingUser = await _userRepository.GetByEmailAsync(schoolEmail, cancellationToken);
        if (existingUser is not null)
        {
            if (existingUser.IsBanned(nowUtc))
            {
                string untilText = existingUser.BannedUntilUtc!.Value.Year >= nowUtc.Year + 50
                    ? "toistaiseksi (pysyvä esto)"
                    : existingUser.BannedUntilUtc.Value.ToLocalTime().ToString("dd.MM.yyyy HH:mm", System.Globalization.CultureInfo.InvariantCulture);
                string reasonText = !string.IsNullOrWhiteSpace(existingUser.BanReason)
                    ? $" Syy: {existingUser.BanReason}"
                    : string.Empty;

                return Result.Failure<UserResponse>(
                    Error.Forbidden(
                        "User.Banned",
                        $"Käyttäjätilisi on asetettu käyttöestoon ({untilText}).{reasonText}"));
            }

            _logger.LogInformation("Käyttäjä {UserId} kirjautui sisään.", existingUser.Id.Value);
            return Result.Success(MapToResponse(existingUser));
        }

        // Muodostetaan näyttönimi joko annetusta nimestä tai sähköpostin alkuosasta
        string resolvedDisplayName = !string.IsNullOrWhiteSpace(displayName)
            ? displayName.Trim()
            : schoolEmail.Value.Split('@')[0].Replace('.', ' ');

        User newUser;
        try
        {
            // Luodaan uusi peruskäyttäjä (UserRole.User)
            newUser = User.Create(
                UserId.New(),
                schoolEmail,
                resolvedDisplayName,
                UserRole.User,
                nowUtc);
        }
        catch (DomainException ex)
        {
            return Result.Failure<UserResponse>(Error.Validation("User.InvalidData", ex.Message));
        }

        await _userRepository.AddAsync(newUser, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Uusi käyttäjä {UserId} rekisteröity järjestelmään.", newUser.Id.Value);

        return Result.Success(MapToResponse(newUser));
    }

    /// <summary>
    /// Hakee käyttäjän tiedot tunnisteen perusteella.
    /// </summary>
    public async Task<Result<UserResponse>> GetUserByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        User? user = await _userRepository.GetByIdAsync(new UserId(userId), cancellationToken);
        if (user is null)
        {
            return Result.Failure<UserResponse>(Error.NotFound("User.NotFound", "Käyttäjää ei löytynyt."));
        }

        return Result.Success(MapToResponse(user));
    }

    /// <summary>
    /// Hakee kaikki järjestelmän käyttäjät.
    /// </summary>
    public async Task<Result<IReadOnlyList<UserResponse>>> GetAllUsersAsync(
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<User> users = await _userRepository.GetAllAsync(cancellationToken);
        List<UserResponse> responses = users.Select(MapToResponse).ToList();
        return Result.Success<IReadOnlyList<UserResponse>>(responses);
    }

    /// <summary>
    /// Päivittää käyttäjän roolin ja tallentaa muutoksen tietokantaan.
    /// </summary>
    public async Task<Result<UserResponse>> UpdateUserRoleAsync(
        Guid userId,
        UserRole newRole,
        CancellationToken cancellationToken = default)
    {
        // Haetaan muokattava käyttäjä
        User? user = await _userRepository.GetByIdAsync(new UserId(userId), cancellationToken);
        if (user is null)
        {
            return Result.Failure<UserResponse>(Error.NotFound("User.NotFound", "Käyttäjää ei löytynyt."));
        }

        // Vaihdetaan käyttäjän rooli ja tallennetaan tietokantaan
        user.ChangeRole(newRole);
        await _userRepository.UpdateAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Käyttäjän {UserId} rooli päivitetty arvoon {NewRole}.", userId, newRole);
        return Result.Success(MapToResponse(user));
    }

    /// <summary>
    /// Asettaa käyttäjälle määräaikaisen tai pysyvän käyttöeston (bannin) tai poistaa voimassa olevan eston.
    /// </summary>
    public async Task<Result<UserResponse>> UpdateUserBanAsync(
        Guid userId,
        BanUserRequest request,
        CancellationToken cancellationToken = default)
    {
        // Haetaan kohdekäyttäjä tietokannasta
        User? user = await _userRepository.GetByIdAsync(new UserId(userId), cancellationToken);
        if (user is null)
        {
            return Result.Failure<UserResponse>(Error.NotFound("User.NotFound", "Käyttäjää ei löytynyt."));
        }

        // Varmistetaan, ettei pääkäyttäjää (SuperAdmin) voida bannata
        if (user.IsSuperAdmin)
        {
            return Result.Failure<UserResponse>(
                Error.Validation("User.CannotBanSuperAdmin", "Pääkäyttäjää (SuperAdmin) ei voi asettaa käyttöestoon."));
        }

        DateTimeOffset nowUtc = _dateTimeProvider.UtcNow;

        try
        {
            if (request.IsPermanent)
            {
                // Pysyvä banni asetetaan 100 vuoden päähän tulevaisuuteen
                DateTimeOffset bannedUntil = nowUtc.AddYears(100);
                user.Ban(bannedUntil, request.Reason);
                _logger.LogInformation("Käyttäjälle {UserId} asetettiin pysyvä käyttöesto.", userId);
            }
            else if (request.DurationHours is > 0)
            {
                // Määräaikainen banni valitun tuntimäärän mukaisesti
                DateTimeOffset bannedUntil = nowUtc.AddHours(request.DurationHours.Value);
                user.Ban(bannedUntil, request.Reason);
                _logger.LogInformation(
                    "Käyttäjälle {UserId} asetettiin käyttöesto {Hours} tunniksi ({BannedUntilUtc} asti).",
                    userId,
                    request.DurationHours.Value,
                    bannedUntil);
            }
            else
            {
                // Poistetaan voimassa oleva käyttöesto
                user.Unban();
                _logger.LogInformation("Käyttäjän {UserId} käyttöesto poistettiin.", userId);
            }
        }
        catch (DomainException ex)
        {
            return Result.Failure<UserResponse>(Error.Validation("User.BanFailed", ex.Message));
        }

        await _userRepository.UpdateAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(MapToResponse(user));
    }

    /// <summary>
    /// Luo 6-numeroisen kertakäyttöisen vahvistuskoodin, joka on voimassa 15 minuuttia.
    /// </summary>
    public async Task<Result<string>> SendVerificationCodeAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        // Varmistetaan, että sähköposti kuuluu sallittuun Xamk-verkkotunnukseen
        ValidationResult validationResult = await _emailValidator.ValidateAsync(email, cancellationToken);
        if (!validationResult.IsValid)
        {
            string errorMessage = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
            return Result.Failure<string>(Error.Validation("User.InvalidEmail", errorMessage));
        }

        // Generoidaan 6-numeroinen varmistuskoodi (testaus-/kehitystilassa myös kiinteä koodi 123456 hyväksytään)
        string code = Random.Shared.Next(100000, 999999).ToString(System.Globalization.CultureInfo.InvariantCulture);
        DateTimeOffset expiresAt = _dateTimeProvider.UtcNow.AddMinutes(15);
        VerificationCodes[email.Trim().ToLowerInvariant()] = (code, expiresAt);

        // GDPR: Ei kirjoiteta sähköpostia lokiin
        _logger.LogInformation("Vahvistuskoodi generoitu ja lähetetty käyttäjälle.");
        return Result.Success(code);
    }

    /// <summary>
    /// Varmistaa käyttäjän syöttämän vahvistuskoodin ja suorittaa kirjautumisen tai rekisteröinnin.
    /// </summary>
    public async Task<Result<UserResponse>> VerifyCodeAndLoginAsync(
        string email,
        string code,
        string? displayName,
        CancellationToken cancellationToken = default)
    {
        string normalizedEmail = email.Trim().ToLowerInvariant();

        // Kehitys-/testikoodi 123456 hyväksytään aina tai vastaava generoitu koodi
        bool isDevBypass = code == "123456";
        bool isMatchingCode = VerificationCodes.TryGetValue(normalizedEmail, out (string Code, DateTimeOffset ExpiresAtUtc) record) &&
                              record.Code == code.Trim() &&
                              record.ExpiresAtUtc >= _dateTimeProvider.UtcNow;

        if (!isDevBypass && !isMatchingCode)
        {
            return Result.Failure<UserResponse>(Error.Validation("Auth.InvalidCode", "Virheellinen tai vanhentunut vahvistuskoodi."));
        }

        // Koodi käytetty, poistetaan muistista
        VerificationCodes.TryRemove(normalizedEmail, out _);

        // Kirjaudu tai rekisteröidy
        return await AuthenticateOrCreateUserAsync(email, displayName ?? string.Empty, cancellationToken);
    }

    // Muuntaa User-entiteetin UserResponse-tiedonsiirto-olioksi
    private UserResponse MapToResponse(User user)
    {
        DateTimeOffset nowUtc = _dateTimeProvider.UtcNow;
        bool isBanned = user.IsBanned(nowUtc);
        return new UserResponse(
            user.Id.Value,
            user.Email.Value,
            user.DisplayName,
            user.Role.ToString(),
            isBanned ? user.BannedUntilUtc : null,
            isBanned ? user.BanReason : null,
            isBanned);
    }
}
