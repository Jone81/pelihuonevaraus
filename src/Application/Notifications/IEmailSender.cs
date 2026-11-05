namespace Pelihuone.Application.Notifications;

/// <summary>
/// Rajapinta sähköpostiviestien lähettämiseen SMTP-palvelimen tai taustajärjestelmän kautta.
/// </summary>
public interface IEmailSender
{
    /// <summary>
    /// Lähettää sähköpostiviestin määritellyille vastaanottajille.
    /// </summary>
    /// <param name="recipients">Vastaanottajien sähköpostiosoitteet.</param>
    /// <param name="subject">Sähköpostin otsikko.</param>
    /// <param name="body">Sähköpostin leipäteksti.</param>
    /// <param name="isHtml">Ilmaisee, onko viestin sisältö HTML-muotoiltua.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns><c>true</c>, jos viestin lähetys onnistui; muuten <c>false</c>.</returns>
    Task<bool> SendEmailAsync(
        IReadOnlyList<string> recipients,
        string subject,
        string body,
        bool isHtml = false,
        CancellationToken cancellationToken = default);
}
