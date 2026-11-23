using FluentValidation;

namespace Pelihuone.Application.Users.Validators;

/// <summary>
/// Validaattori, joka tarkistaa, että sähköpostiosoite kuuluu sallittuun oppilaitoksen verkkotunnukseen (<c>@edu.xamk.fi</c> tai <c>@xamk.fi</c>).
/// </summary>
public sealed class SchoolEmailValidator : AbstractValidator<string>
{
    private static readonly string[] AllowedDomains = ["@edu.xamk.fi", "@xamk.fi"];

    /// <summary>
    /// Alustaa oppilaitoksen sähköpostin validointisäännöt.
    /// </summary>
    public SchoolEmailValidator()
    {
        // Sähköposti ei saa olla tyhjä ja sen on päätyttävä sallittuun Xamk-verkkotunnukseen
        RuleFor(email => email)
            .NotEmpty().WithMessage("Sähköposti ei voi olla tyhjä.")
            .Must(BeAllowedSchoolDomain)
            .WithMessage("Sähköpostiosoitteen on oltava oppilaitoksen osoite (@edu.xamk.fi tai @xamk.fi).");
    }

    // Tarkistaa, päättyykö siistitty sähköpostiosoite johonkin sallituista verkkotunnuksista
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
