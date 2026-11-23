using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;

namespace Pelihuone.Application.Abstractions.Repositories;

/// <summary>
/// Tietovarastorajapinta käyttäjätietojen hakuun ja tallennukseen.
/// </summary>
public interface IUserRepository
{
    /// <summary>
    /// Hakee käyttäjän hänen yksilöllisen tunnisteensa perusteella.
    /// </summary>
    Task<User?> GetByIdAsync(UserId id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee käyttäjän oppilaitoksen sähköpostiosoitteen perusteella.
    /// </summary>
    Task<User?> GetByEmailAsync(SchoolEmail email, CancellationToken cancellationToken = default);

    /// <summary>
    /// Hakee kaikki järjestelmään rekisteröityneet käyttäjät.
    /// </summary>
    Task<IReadOnlyList<User>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Lisää uuden käyttäjän tietovarastoon.
    /// </summary>
    Task AddAsync(User user, CancellationToken cancellationToken = default);

    /// <summary>
    /// Päivittää olemassa olevan käyttäjän tiedot tietovarastoon.
    /// </summary>
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);
}
