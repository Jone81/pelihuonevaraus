using Microsoft.EntityFrameworkCore;
using Pelihuone.Application.Abstractions.Repositories;
using Pelihuone.Domain.Models;
using Pelihuone.Domain.ValueObjects;
using Pelihuone.Infrastructure.Persistence;

namespace Pelihuone.Infrastructure.Repositories;

/// <summary>
/// EF Core -pohjainen toteutus <see cref="IUserRepository"/>-rajapinnalle käyttäjätietojen
/// hakemiseen ja tallentamiseen.
/// </summary>
public sealed class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    /// <summary>
    /// Alustaa uuden <see cref="UserRepository"/>-instanssin annetulla tietokantakontekstilla.
    /// </summary>
    /// <param name="context">Sovelluksen tietokantakonteksti.</param>
    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Hakee käyttäjän tämän yksilöllisen tunnisteen perusteella.
    /// </summary>
    /// <param name="id">Haettavan käyttäjän tunniste.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Löytynyt <see cref="User"/>-entiteetti tai <c>null</c>, jos käyttäjää ei löydy.</returns>
    public async Task<User?> GetByIdAsync(UserId id, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    /// <summary>
    /// Hakee käyttäjän koulun sähköpostiosoitteen perusteella.
    /// </summary>
    /// <param name="email">Haettavan käyttäjän sähköpostiosoite.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Löytynyt <see cref="User"/>-entiteetti tai <c>null</c>, jos käyttäjää ei löydy.</returns>
    public async Task<User?> GetByEmailAsync(SchoolEmail email, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    }

    /// <summary>
    /// Hakee kaikki järjestelmän käyttäjät näyttönimen mukaan aakkosjärjestyksessä.
    /// </summary>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Vain luku -lista kaikista käyttäjistä.</returns>
    public async Task<IReadOnlyList<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // Haetaan käyttäjälista aakkosjärjestyksessä ilman muutosseurantaa
        return await _context.Users
            .AsNoTracking()
            .OrderBy(u => u.DisplayName)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Lisää uuden käyttäjän tietokantakontekstiin tallennusta varten.
    /// </summary>
    /// <param name="user">Lisättävä <see cref="User"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Tehtävä, joka edustaa asynkronista lisäysoperaatiota.</returns>
    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await _context.Users.AddAsync(user, cancellationToken);
    }

    /// <summary>
    /// Merkitsee käyttäjän päivitetyksi tietokantakontekstissa.
    /// </summary>
    /// <param name="user">Päivitettävä <see cref="User"/>-entiteetti.</param>
    /// <param name="cancellationToken">Peruutustunniste asynkronisen operaation keskeyttämiseen.</param>
    /// <returns>Valmis tehtävä.</returns>
    public Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        _context.Users.Update(user);
        return Task.CompletedTask;
    }
}
