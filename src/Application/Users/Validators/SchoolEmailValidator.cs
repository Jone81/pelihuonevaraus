using FluentValidation;

namespace Pelihuone.Application.Users.Validators;

public sealed class SchoolEmailValidator : AbstractValidator<string>
{
    private static readonly string[] AllowedDomains = ["@edu.xamk.fi", "@xamk.fi"];

    public SchoolEmailValidator()
    {
        RuleFor(email => email)
            .NotEmpty().WithMessage("Sähköposti ei voi olla tyhjä.")
            .Must(BeAllowedSchoolDomain)
            .WithMessage("Sähköpostiosoitteen on oltava oppilaitoksen osoite (@edu.xamk.fi tai @xamk.fi).");
    }

    private static bool BeAllowedSchoolDomain(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        string normalized = email.Trim().ToLowerInvariant();
        return AllowedDomains.Any(domain => normalized.EndsWith(domain, StringComparison.OrdinalIgnoreCase));
    }
}
