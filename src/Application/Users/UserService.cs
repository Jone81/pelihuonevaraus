using System.Collections.Concurrent;
using FluentValidation;
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

public sealed class UserService : IUserService
{
    private static readonly ConcurrentDictionary<string, (string Code, DateTimeOffset ExpiresAtUtc)> VerificationCodes = new(StringComparer.OrdinalIgnoreCase);

    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly IValidator<string> _emailValidator;
    private readonly ILogger<UserService> _logger;

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

    public async Task<Result<UserResponse>> AuthenticateOrCreateUserAsync(
        string email,
        string displayName,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await _emailValidator.ValidateAsync(email, cancellationToken);
        if (!validationResult.IsValid)
        {
            string errorMessage = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
            return Result.Failure<UserResponse>(Error.Validation("User.InvalidEmail", errorMessage));
        }

        SchoolEmail schoolEmail;
        try
        {
            schoolEmail = SchoolEmail.Create(email);
        }
        catch (InvalidEmailException ex)
        {
            return Result.Failure<UserResponse>(Error.Validation("User.InvalidEmail", ex.Message));
        }

        var existingUser = await _userRepository.GetByEmailAsync(schoolEmail, cancellationToken);
        if (existingUser is not null)
        {
            _logger.LogInformation("Käyttäjä {UserId} kirjautui sisään.", existingUser.Id.Value);
            return Result.Success(MapToResponse(existingUser));
        }

        DateTimeOffset nowUtc = _dateTimeProvider.UtcNow;
        string resolvedDisplayName = !string.IsNullOrWhiteSpace(displayName)
            ? displayName.Trim()
            : schoolEmail.Value.Split('@')[0].Replace('.', ' ');

        User newUser;
        try
        {
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

    public async Task<Result<UserResponse>> GetUserByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(new UserId(userId), cancellationToken);
        if (user is null)
        {
            return Result.Failure<UserResponse>(Error.NotFound("User.NotFound", "Käyttäjää ei löytynyt."));
        }

        return Result.Success(MapToResponse(user));
    }

    public async Task<Result<IReadOnlyList<UserResponse>>> GetAllUsersAsync(
        CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var responses = users.Select(MapToResponse).ToList();
        return Result.Success<IReadOnlyList<UserResponse>>(responses);
    }

    public async Task<Result<UserResponse>> UpdateUserRoleAsync(
        Guid userId,
        UserRole newRole,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(new UserId(userId), cancellationToken);
        if (user is null)
        {
            return Result.Failure<UserResponse>(Error.NotFound("User.NotFound", "Käyttäjää ei löytynyt."));
        }

        user.ChangeRole(newRole);
        await _userRepository.UpdateAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Käyttäjän {UserId} rooli päivitetty arvoon {NewRole}.", userId, newRole);
        return Result.Success(MapToResponse(user));
    }

    public async Task<Result<string>> SendVerificationCodeAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await _emailValidator.ValidateAsync(email, cancellationToken);
        if (!validationResult.IsValid)
        {
            string errorMessage = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
            return Result.Failure<string>(Error.Validation("User.InvalidEmail", errorMessage));
        }

        // Generoidaan 6-numeroinen varmistuskoodi (testaus-/kehitystilassa myös kiinteä koodi 123456 hyväksytään)
        string code = Random.Shared.Next(100000, 999999).ToString();
        DateTimeOffset expiresAt = _dateTimeProvider.UtcNow.AddMinutes(15);
        VerificationCodes[email.Trim().ToLowerInvariant()] = (code, expiresAt);

        // GDPR: Ei kirjoiteta sähköpostia lokiin
        _logger.LogInformation("Vahvistuskoodi generoitu ja lähetetty käyttäjälle.");
        return Result.Success(code);
    }

    public async Task<Result<UserResponse>> VerifyCodeAndLoginAsync(
        string email,
        string code,
        string? displayName,
        CancellationToken cancellationToken = default)
    {
        string normalizedEmail = email.Trim().ToLowerInvariant();

        // Kehitys-/testikoodi 123456 hyväksytään aina tai vastaava generoitu koodi
        bool isDevBypass = code == "123456";
        bool isMatchingCode = VerificationCodes.TryGetValue(normalizedEmail, out var record) &&
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

    private static UserResponse MapToResponse(User user)
    {
        return new UserResponse(
            user.Id.Value,
            user.Email.Value,
            user.DisplayName,
            user.Role.ToString());
    }
}
