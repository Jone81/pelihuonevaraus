using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

/// <summary>
/// Juurientiteetti (Aggregate Root), joka edustaa järjestelmän käyttäjää ja hänen käyttöoikeusrooliaan.
/// </summary>
public sealed class User : AggregateRoot<UserId>
{
    /// <summary>
    /// Käyttäjän validoitu oppilaitoksen sähköpostiosoite.
    /// </summary>
    public SchoolEmail Email { get; private set; }

    /// <summary>
    /// Käyttäjän näyttönimi järjestelmässä.
    /// </summary>
    public string DisplayName { get; private set; }

    /// <summary>
    /// Käyttäjän rooli (User, Admin tai SuperAdmin).
    /// </summary>
    public UserRole Role { get; private set; }

    /// <summary>
    /// Käyttäjätilin luontihetken UTC-aikaleima.
    /// </summary>
    public DateTimeOffset CreatedAtUtc { get; private set; }

    /// <summary>
    /// Ilmaisee, onko käyttäjällä pääkäyttäjän (<see cref="UserRole.SuperAdmin"/>) oikeudet.
    /// </summary>
    public bool IsSuperAdmin => Role == UserRole.SuperAdmin;

    /// <summary>
    /// Ilmaisee, kuuluuko käyttäjä ylläpitoon (<see cref="UserRole.Admin"/> tai <see cref="UserRole.SuperAdmin"/>).
    /// </summary>
    public bool IsAdmin => Role is UserRole.Admin or UserRole.SuperAdmin;

#pragma warning disable CS8618
    // EF Coren vaatima parametriton konstruktori.
    private User() : base(UserId.Empty)
    {
    }
#pragma warning restore CS8618

    private User(UserId id, SchoolEmail email, string displayName, UserRole role, DateTimeOffset createdAtUtc)
        : base(id)
    {
        Email = email;
        DisplayName = displayName;
        Role = role;
        CreatedAtUtc = createdAtUtc;
    }

    /// <summary>
    /// Luo uuden käyttäjän ja varmistaa, että näyttönimi ei ole tyhjä.
    /// </summary>
    /// <param name="id">Käyttäjän yksilöivä tunniste.</param>
    /// <param name="email">Käyttäjän validoitu koulusähköpostiosoite.</param>
    /// <param name="displayName">Käyttäjän näyttönimi.</param>
    /// <param name="role">Käyttäjän rooli.</param>
    /// <param name="createdAtUtc">Luontihetken UTC-aikaleima.</param>
    /// <returns>Validoitu <see cref="User"/>-entiteetti.</returns>
    public static User Create(
        UserId id,
        SchoolEmail email,
        string displayName,
        UserRole role,
        DateTimeOffset createdAtUtc)
    {
        // Domain-sääntö: Käyttäjällä on oltava ei-tyhjä näyttönimi.
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new DomainException("Käyttäjän nimi ei voi olla tyhjä.");
        }

        return new User(id, email, displayName.Trim(), role, createdAtUtc);
    }

    /// <summary>
    /// Muuttaa käyttäjän käyttöoikeusroolia.
    /// </summary>
    /// <param name="newRole">Uusi käyttäjärooli.</param>
    public void ChangeRole(UserRole newRole)
    {
        Role = newRole;
    }

    /// <summary>
    /// Päivittää käyttäjän näyttönimen.
    /// </summary>
    /// <param name="displayName">Uusi näyttönimi.</param>
    public void UpdateDisplayName(string displayName)
    {
        // Tarkistetaan, ettei nimeä päivitetä tyhjäksi.
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new DomainException("Käyttäjän nimi ei voi olla tyhjä.");
        }

        DisplayName = displayName.Trim();
    }
}
