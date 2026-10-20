using Pelihuone.Domain.Common;
using Pelihuone.Domain.Enums;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Domain.Models;

public sealed class User : AggregateRoot<UserId>
{
    public SchoolEmail Email { get; private set; }
    public string DisplayName { get; private set; }
    public UserRole Role { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }

    public bool IsSuperAdmin => Role == UserRole.SuperAdmin;
    public bool IsAdmin => Role is UserRole.Admin or UserRole.SuperAdmin;

#pragma warning disable CS8618
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

    public static User Create(
        UserId id,
        SchoolEmail email,
        string displayName,
        UserRole role,
        DateTimeOffset createdAtUtc)
    {
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new DomainException("Käyttäjän nimi ei voi olla tyhjä.");
        }

        return new User(id, email, displayName.Trim(), role, createdAtUtc);
    }

    public void ChangeRole(UserRole newRole)
    {
        Role = newRole;
    }

    public void UpdateDisplayName(string displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new DomainException("Käyttäjän nimi ei voi olla tyhjä.");
        }

        DisplayName = displayName.Trim();
    }
}
