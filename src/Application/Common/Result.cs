namespace Pelihuone.Application.Common;

/// <summary>
/// Edustaa operaation lopputulosta, joka voi olla joko onnistunut tai epäonnistunut ilman poikkeusten heittämistä.
/// </summary>
public class Result
{
    /// <summary>
    /// Ilmaisee, onnistuiko operaatio.
    /// </summary>
    public bool IsSuccess { get; }

    /// <summary>
    /// Ilmaisee, epäonnistuiko operaatio.
    /// </summary>
    public bool IsFailure => !IsSuccess;

    /// <summary>
    /// Operaation virhetieto, tai <see cref="Error.None"/> jos operaatio onnistui.
    /// </summary>
    public Error Error { get; }

    /// <summary>
    /// Alustaa uuden <see cref="Result"/>-olion ja varmistaa tilan eheyden.
    /// </summary>
    protected Result(bool isSuccess, Error error)
    {
        // Varmistetaan, ettei onnistuneeseen tulokseen liitetä virhettä
        if (isSuccess && error != Error.None)
        {
            throw new InvalidOperationException("Onnistunut Result ei voi sisältää virhettä.");
        }

        // Varmistetaan, että epäonnistunut tulos sisältää aina varsinaisen virheen
        if (!isSuccess && error == Error.None)
        {
            throw new InvalidOperationException("Epäonnistuneen Resultin on sisällettävä virhe.");
        }

        IsSuccess = isSuccess;
        Error = error;
    }

    /// <summary>
    /// Luo onnistuneen lopputuloksen ilman paluuarvoa.
    /// </summary>
    public static Result Success() => new(true, Error.None);

    /// <summary>
    /// Luo epäonnistuneen lopputuloksen annetulla virheellä.
    /// </summary>
    public static Result Failure(Error error) => new(false, error);

    /// <summary>
    /// Luo onnistuneen lopputuloksen, joka sisältää paluuarvon.
    /// </summary>
    public static Result<TValue> Success<TValue>(TValue value) => new(value, true, Error.None);

    /// <summary>
    /// Luo epäonnistuneen tyypitetyn lopputuloksen annetulla virheellä.
    /// </summary>
    public static Result<TValue> Failure<TValue>(Error error) => new(default, false, error);
}

/// <summary>
/// Edustaa operaation lopputulosta, joka palauttaa onnistuessaan tyypitetyn arvon <typeparamref name="TValue"/>.
/// </summary>
/// <typeparam name="TValue">Paluuarvon tyyppi.</typeparam>
public class Result<TValue> : Result
{
    private readonly TValue? _value;

    /// <summary>
    /// Palauttaa onnistuneen operaation arvon tai heittää poikkeuksen, jos tulos on epäonnistunut.
    /// </summary>
    public TValue Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("Epäonnistuneen Resultin arvoa ei voi lukea.");

    /// <summary>
    /// Alustaa uuden tyypitetyn <see cref="Result{TValue}"/>-olion.
    /// </summary>
    protected internal Result(TValue? value, bool isSuccess, Error error)
        : base(isSuccess, error)
    {
        _value = value;
    }

    /// <summary>
    /// Muuntaa arvon implisiittisesti <see cref="Result{TValue}"/>-olioksi. Null-arvo tuottaa virheen.
    /// </summary>
    public static implicit operator Result<TValue>(TValue? value) =>
        value is not null ? Success(value) : Failure<TValue>(Error.NullValue);

    /// <summary>
    /// Muuntaa <see cref="Error"/>-olion implisiittisesti epäonnistuneeksi <see cref="Result{TValue}"/>-olioksi.
    /// </summary>
    public static implicit operator Result<TValue>(Error error) =>
        Failure<TValue>(error);
}
