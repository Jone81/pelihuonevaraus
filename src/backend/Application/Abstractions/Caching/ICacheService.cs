namespace Pelihuone.Application.Abstractions.Caching;

/// <summary>
/// Kehysriippumaton välimuistipalvelun rajapinta kyselytulosten tallentamiseen ja invalidoimiseen.
/// </summary>
public interface ICacheService
{
    /// <summary>
    /// Hakee arvon välimuistista annetulla avaimella tai luo ja tallentaa sen välimuistiin tehdasfunktion avulla.
    /// </summary>
    /// <typeparam name="T">Välimuistiin tallennettavan arvon tyyppi.</typeparam>
    /// <param name="key">Yksilöllinen välimuistiavain.</param>
    /// <param name="factory">Asynkroninen funktio, joka luo arvon, jos sitä ei löydy välimuistista.</param>
    /// <param name="expiration">Valinnainen voimassaoloaika välimuistimerkinnälle.</param>
    /// <param name="tags">Valinnaiset tunnisteet, joiden avulla merkintä voidaan invalidoida ryhmittäin.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Välimuistista haettu tai tehdasfunktiolla luotu arvo.</returns>
    Task<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, ValueTask<T>> factory,
        TimeSpan? expiration = null,
        IReadOnlyCollection<string>? tags = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Poistaa yksittäisen merkinnän välimuistista avaimen perusteella.
    /// </summary>
    /// <param name="key">Poistettavan merkinnän välimuistiavain.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Asynkroninen tehtävä, joka kuvaa poisto-operaatiota.</returns>
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Poistaa kaikki annettuun tunnisteeseen liitetyt merkinnät välimuistista.
    /// </summary>
    /// <param name="tag">Invalidoitava välimuistitunniste.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Asynkroninen tehtävä, joka kuvaa poisto-operaatiota.</returns>
    Task RemoveByTagAsync(string tag, CancellationToken cancellationToken = default);
}
