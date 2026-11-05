namespace Pelihuone.Application.Abstractions.Data;

/// <summary>
/// Työyksikkörajapinta (Unit of Work), joka vastaa tietokantamuutosten tallentamisesta yhtenä kokonaisuutena.
/// </summary>
public interface IUnitOfWork
{
    /// <summary>
    /// Tallentaa kaikki odottavat tietokantamuutokset asynkronisesti.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Tallennettujen tietokantarivien lukumäärä.</returns>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
