using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Common;

namespace Pelihuone.WebApi.Extensions;

/// <summary>
/// Laajennusmetodit sovelluskerroksen <see cref="Result"/>- ja <see cref="Result{T}"/>-olioiden muuntamiseksi
/// RFC 9457 ProblemDetails -standardin mukaisiksi HTTP-vastauksiksi.
/// </summary>
public static class ResultExtensions
{
    /// <summary>
    /// Muuntaa arvon sisältävän <see cref="Result{T}"/>-tuloksen HTTP-vastaukseksi.
    /// </summary>
    /// <typeparam name="T">Tuloksen sisältämän arvon tyyppi.</typeparam>
    /// <param name="result">Sovelluskerroksen palauttama tulosolio.</param>
    /// <param name="httpContext">Nykyisen HTTP-pyynnön konteksti.</param>
    /// <param name="onSuccess">Valinnainen funktio räätälöidyn onnistumisvastauksen (esim. 201 Created) muodostamiseen.</param>
    /// <returns>Onnistuessa HTTP 200 OK (tai <paramref name="onSuccess"/>-tulos), epäonnistuessa ProblemDetails-virhevastaus.</returns>
    public static IResult ToHttpResult<T>(
        this Result<T> result,
        HttpContext httpContext,
        Func<T, IResult>? onSuccess = null)
    {
        // Jos operaatio onnistui, palautetaan joko räätälöity vastaus tai oletuksena 200 OK arvon kera
        if (result.IsSuccess)
        {
            return onSuccess is not null
                ? onSuccess(result.Value)
                : Results.Ok(result.Value);
        }

        // Epäonnistuneesta tuloksesta muodostetaan ProblemDetails-vastaus
        return ToProblem(result.Error, httpContext);
    }

    /// <summary>
    /// Muuntaa arvottoman <see cref="Result"/>-tuloksen HTTP-vastaukseksi.
    /// </summary>
    /// <param name="result">Sovelluskerroksen palauttama tulosolio.</param>
    /// <param name="httpContext">Nykyisen HTTP-pyynnön konteksti.</param>
    /// <param name="onSuccess">Valinnainen funktio räätälöidyn onnistumisvastauksen muodostamiseen.</param>
    /// <returns>Onnistuessa HTTP 200 OK (tai <paramref name="onSuccess"/>-tulos), epäonnistuessa ProblemDetails-virhevastaus.</returns>
    public static IResult ToHttpResult(
        this Result result,
        HttpContext httpContext,
        Func<IResult>? onSuccess = null)
    {
        // Jos operaatio onnistui, palautetaan joko räätälöity vastaus tai tyhjä 200 OK
        if (result.IsSuccess)
        {
            return onSuccess is not null
                ? onSuccess()
                : Results.Ok();
        }

        // Epäonnistuneesta tuloksesta muodostetaan ProblemDetails-vastaus
        return ToProblem(result.Error, httpContext);
    }

    /// <summary>
    /// Muodostaa <see cref="Error"/>-virheoliosta RFC 9457 -yhteensopivan <see cref="ProblemDetails"/>-vastauksen.
    /// </summary>
    /// <param name="error">Käsiteltävä virheolio.</param>
    /// <param name="httpContext">Nykyisen HTTP-pyynnön konteksti.</param>
    /// <returns>JSON-muotoinen ProblemDetails HTTP-vastaus asianmukaisella tilakoodilla.</returns>
    public static IResult ToProblem(Error error, HttpContext httpContext)
    {
        // Mäppäys virhetyypistä HTTP-tilakoodiin
        int statusCode = error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status500InternalServerError
        };

        // Rakennetaan ProblemDetails-rakenne pyynnön polulla ja virheen kuvauksella
        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = GetTitle(error.Type),
            Detail = error.Description,
            Type = GetRfcType(statusCode),
            Instance = httpContext.Request.Path
        };

        // Lisätään koneellisesti luettava virhekoodi ja jäljitystunniste (traceId) laajennuskenttiin
        problemDetails.Extensions["code"] = error.Code;

        string? traceId = Activity.Current?.Id ?? httpContext.TraceIdentifier;
        if (!string.IsNullOrEmpty(traceId))
        {
            problemDetails.Extensions["traceId"] = traceId;
        }

        return Results.Json(problemDetails, statusCode: statusCode, contentType: "application/problem+json");
    }

    // Palauttaa suomenkielisen otsikon virhetyypin perusteella
    private static string GetTitle(ErrorType errorType) => errorType switch
    {
        ErrorType.Validation => "Validointivirhe",
        ErrorType.NotFound => "Resurssia ei löytynyt",
        ErrorType.Conflict => "Ristiriita",
        ErrorType.Unauthorized => "Tunnistautuminen vaaditaan",
        ErrorType.Forbidden => "Pääsy evätty",
        _ => "Palvelinvirhe"
    };

    // Palauttaa RFC 9110 -standardin mukaisen viite-URL:n tilakoodille
    private static string GetRfcType(int statusCode) =>
        $"https://tools.ietf.org/html/rfc9110#section-15.{(statusCode >= 500 ? "6.1" : "5.1")}";
}
