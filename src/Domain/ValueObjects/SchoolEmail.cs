using System.Text.RegularExpressions;
using Pelihuone.Domain.Exceptions;

namespace Pelihuone.Domain.ValueObjects;

public sealed partial record SchoolEmail
{
    private static readonly string[] AllowedDomains = ["@edu.xamk.fi", "@xamk.fi"];

    public string Value { get; }

    private SchoolEmail(string value)
    {
        Value = value;
    }

    public static SchoolEmail Create(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new InvalidEmailException("Sähköpostiosoite ei voi olla tyhjä.");
        }

        string normalized = email.Trim().ToLowerInvariant();

        bool hasValidDomain = AllowedDomains.Any(domain => normalized.EndsWith(domain, StringComparison.OrdinalIgnoreCase));
        if (!hasValidDomain)
        {
            throw new InvalidEmailException("Vain oppilaitoksen sähköpostiosoitteet (@edu.xamk.fi tai @xamk.fi) ovat sallittuja.");
        }

        int atIndex = normalized.IndexOf('@');
        if (atIndex <= 0)
        {
            throw new InvalidEmailException("Virheellinen sähköpostiosoitteen muoto.");
        }

        return new SchoolEmail(normalized);
    }

    public override string ToString() => Value;

    public static implicit operator string(SchoolEmail email) => email.Value;
}
