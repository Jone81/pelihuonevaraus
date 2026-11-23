/**
 * @file AuthContext.tsx
 * @description Käyttäjän autentikaatiotilaa ja istuntoa hallinnoiva React-konteksti.
 * Tallentaa kirjautuneen käyttäjän tiedot selaimen `localStorage`-muistiin ja tarjoaa
 * apumetodit sekä pikakirjautumiseen että kaksivaiheiseen sähköpostivahvistukseen (OTP).
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { User } from '../types';

/**
 * Autentikaatiokontekstin julkinen rajapinta.
 */
interface AuthContextType {
  /** Nykyinen kirjautunut käyttäjä tai `null`, jos käyttäjä ei ole kirjautunut */
  user: User | null;
  /** Suora kirjautuminen sähköpostilla ja nimellä (esim. kehitystilan pikatunnukset) */
  login: (email: string, displayName: string) => Promise<void>;
  /** Lähettää 6-numeroisen vahvistuskoodin annettuun koulun sähköpostiosoitteeseen */
  sendVerificationCode: (email: string) => Promise<{ message: string; devCode?: string }>;
  /** Vahvistaa syötetyn koodin ja asettaa käyttäjän kirjautuneeksi */
  verifyCodeAndLogin: (email: string, code: string, displayName?: string) => Promise<void>;
  /** Kirjaa käyttäjän ulos ja tyhjentää tallennetun istunnon */
  logout: () => void;
  /** Onko kirjautuneella käyttäjällä SuperAdmin-oikeudet */
  isSuperAdmin: boolean;
  /** Onko kirjautuneella käyttäjällä Admin- tai SuperAdmin-oikeudet */
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** LocalStorage-avain käyttäjäistunnon pysyväistallennukseen */
const STORAGE_KEY = 'pelihuone_user';

/**
 * Autentikaatiokontekstin tarjoajakomponentti (Provider).
 * Alustaa käyttäjätilan `localStorage`-muistista ja synkronoi muutokset automaattisesti.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Alustetaan käyttäjä localStoragesta, mikäli kelvollinen JSON-istunto löytyy
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as User;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Pidetään localStorage ajan tasalla käyttäjätilan muuttuessa
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  // Suora kirjautuminen API:n kautta
  const login = async (email: string, displayName: string) => {
    const loggedInUser = await api.login(email, displayName);
    setUser(loggedInUser);
  };

  // Pyytää OTP-vahvistuskoodin lähettämistä sähköpostiin
  const sendVerificationCode = async (email: string) => {
    return await api.sendVerificationCode(email);
  };

  // Tarkistaa OTP-koodin ja tallentaa palautetun käyttäjän tilaan
  const verifyCodeAndLogin = async (email: string, code: string, displayName?: string) => {
    const loggedInUser = await api.verifyCodeAndLogin(email, code, displayName);
    setUser(loggedInUser);
  };

  // Uloskirjautuminen nollaa käyttäjätilan
  const logout = () => {
    setUser(null);
  };

  // Johdetut roolitarkistukset käyttöliittymän ehdollista renderöintiä varten
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isAdmin = user?.role === 'Admin' || isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        sendVerificationCode,
        verifyCodeAndLogin,
        logout,
        isSuperAdmin,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook autentikaatiokontekstin käyttämiseen komponenteissa.
 * Heittää virheen, jos sitä kutsutaan `AuthProvider`-komponentin ulkopuolella.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
