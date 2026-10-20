using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Pelihuone.Application.Common;

namespace Pelihuone.WebApi.Extensions;

public static class ResultExtensions
{
    public static IResult ToHttpResult<T>(
        this Result<T> result,
        HttpContext httpContext,
        Func<T, IResult>? onSuccess = null)
    {
        if (result.IsSuccess)
        {
            return onSuccess is not null
                ? onSuccess(result.Value)
                : Results.Ok(result.Value);
        }

        return ToProblem(result.Error, httpContext);
    }

    public static IResult ToHttpResult(
        this Result result,
        HttpContext httpContext,
        Func<IResult>? onSuccess = null)
    {
        if (result.IsSuccess)
        {
            return onSuccess is not null
                ? onSuccess()
                : Results.Ok();
        }

        return ToProblem(result.Error, httpContext);
    }

    public static IResult ToProblem(Error error, HttpContext httpContext)
    {
        int statusCode = error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status500InternalServerError
        };

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = GetTitle(error.Type),
            Detail = error.Description,
            Type = GetRfcType(statusCode),
            Instance = httpContext.Request.Path
        };

        problemDetails.Extensions["code"] = error.Code;

        string? traceId = Activity.Current?.Id ?? httpContext.TraceIdentifier;
        if (!string.IsNullOrEmpty(traceId))
        {
            problemDetails.Extensions["traceId"] = traceId;
        }

        return Results.Json(problemDetails, statusCode: statusCode, contentType: "application/problem+json");
    }

    private static string GetTitle(ErrorType errorType) => errorType switch
    {
        ErrorType.Validation => "Validointivirhe",
        ErrorType.NotFound => "Resurssia ei löytynyt",
        ErrorType.Conflict => "Ristiriita",
        ErrorType.Unauthorized => "Tunnistautuminen vaaditaan",
        ErrorType.Forbidden => "Pääsy evätty",
        _ => "Palvelinvirhe"
    };

    private static string GetRfcType(int statusCode) =>
        $"https://tools.ietf.org/html/rfc9110#section-15.{(statusCode >= 500 ? "6.1" : "5.1")}";
}
