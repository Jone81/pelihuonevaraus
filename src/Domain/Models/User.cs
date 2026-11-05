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
    /// Aikaleima (UTC), johon asti käyttäjän käyttöesto (banni / porttikielto) on voimassa.
    /// Jos arvo on <see langword="null"/> tai menneisyydessä, käyttäjä ei ole estetty.
    /// </summary>
    public DateTimeOffset? BannedUntilUtc { get; private set; }

    /// <summary>
    /// Ylläpitäjän kirjaama syy tai perustelu käyttäjän käyttöestolle (bannaukselle).
    /// </summary>
    public string? BanReason { get; private set; }

    /// <summary>
    /// Ilmaisee, onko käyttäjällä pääkäyttäjän (<see cref="UserRole.SuperAdmin"/>) oikeudet.
    /// </summary>
    public bool IsSuperAdmin => Role == UserRole.SuperAdmin;

    /// <summary>
    /// Ilmaisee, kuuluuko käyttäjä ylläpitoon (<see cref="UserRole.Admin"/> tai <see cref="UserRole.SuperAdmin"/>).
    /// </summary>
    public bool IsAdmin => Role is UserRole.Admin or UserRole.SuperAdmin;

    /// <summary>
    /// Tarkistaa, onko käyttäjällä voimassa oleva käyttöesto (banni) annettuna tarkasteluhetkenä.
    /// </summary>
    /// <param name="nowUtc">Nykyinen UTC-aika, johon bannin päättymisaikaa verrataan.</param>
    /// <returns><see langword="true"/>, jos käyttäjä on parhaillaan bannattu; muuten <see langword="false"/>.</returns>
    public bool IsBanned(DateTimeOffset nowUtc) => BannedUntilUtc.HasValue && BannedUntilUtc.Value > nowUtc;

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

    /// <summary>
    /// Asettaa käyttäjälle määräaikaisen tai pysyvän käyttöeston (bannin / porttikiellon).
    /// Pääkäyttäjää (<see cref="UserRole.SuperAdmin"/>) ei voida asettaa käyttöestoon.
    /// </summary>
    /// <param name="bannedUntilUtc">UTC-aikaleima, johon asti käyttöesto on voimassa.</param>
    /// <param name="reason">Valinnainen syy käyttöestolle.</param>
    public void Ban(DateTimeOffset bannedUntilUtc, string? reason = null)
    {
        // Domain-sääntö: Pääkäyttäjää (SuperAdmin) ei voi bannata järjestelmästä
        if (IsSuperAdmin)
        {
            throw new DomainException("Pääkäyttäjää (SuperAdmin) ei voi asettaa käyttöestoon.");
        }

        BannedUntilUtc = bannedUntilUtc;
        BanReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
    }

    /// <summary>
    /// Poistaa käyttäjältä voimassa olevan käyttöeston (bannin) ja palauttaa normaalit käyttöoikeudet.
    /// </summary>
    public void Unban()
    {
        BannedUntilUtc = null;
        BanReason = null;
    }
}
