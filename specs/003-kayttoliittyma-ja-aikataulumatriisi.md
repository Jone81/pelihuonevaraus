# Spec 003 — Käyttöliittymä, Xamk-brändi ja interaktiivinen aikataulumatriisi

## Tarina

Opiskelijana ja ylläpitäjänä haluan käyttää Xamkin brändiohjeiston mukaista, kaksikielistä (`Suomi` / `English`) käyttöliittymää, jossa näen kaikkien 8 pelipisteen päiväaikataulun yhdessä taulukossa ja voin valita aloitus- ja päättymisajan vetämällä hiirellä suoraan aikataulusta, jotta laitteen varaaminen ja tilan hallinta on nopeaa sekä tietokoneella että puhelimella.

## Käsitteet

Sanasto ja kentät: `Docs/domain.md` ja visuaalinen määrittely `Docs/UI_SPEC.md`.

## Tekemiset

| Tekeminen | Onnistuu kun | Epäonnistuu kun |
|-----------|--------------|-----------------|
| Kirjautumaton laskeutumissivu (`LandingPage`) | Käyttäjä ei ole kirjautunut (`user === null`). Yläpalkissa näkyy vain Xamk-logo, kielenvaihtaja ja `Kirjaudu sisään` -painike; navigaatiolinkit on piilotettu. | — |
| Aikavälin valinta hiirellä raahaamalla (`Drag-to-Select`) | Käyttäjä klikkaa tai vetää hiirellä vapaiden tuntisolujen (`08:00–17:00`) yli minkä tahansa pelipisteen rivillä. Valitsee kyseisen laitteen ja päivittää `startHour`- ja `endHour`-kentät. | Solu on varattu (`slot-td-busy`) → raahaus pysähtyy ennen varattua solua ja enintään 4 h (tai Adminilla 10 h) rajaan. |
| URL-reititys (`RouterProvider`) | Jokaisella näkymällä (`/book`, `/status`, `/games`, `/rules`, `/my-bookings`, `/admin/*`, `/superadmin`) on oma URL-polku, joka tukee selaimen historiaa. | Tuntematon polku → ohjaa oletusnäkymään (`/book`). |
| Admin- ja SuperAdmin-hallinta | Kirjautuneella käyttäjällä on `Admin`- tai `SuperAdmin`-rooli. Avaa 6-välilehtisen hallintapaneelin tai pääkäyttäjän jyräysnäkymän. | Tavallinen `User` ei näe ylläpitovalikoita. |

## Säännöt ja Paikka

Viittaukset `Docs/UI_SPEC.md`:n invariantteihin (`UI-1`–`UI-6`) ja `Docs/domain.md`:n sääntöihin:

- **UI-1** (kirjautumattoman yläpalkin lukitus) — `LandingPage.tsx`, `Navbar.tsx`
- **UI-2** (`SharedTV`-lukon ja varattujen aikojen visualisointi) — `BookingCalendar.tsx`
- **UI-3** (näkymäkohtainen URL-reititys) — `router.tsx`, `App.tsx`
- **UI-4** (täydellinen `fi`/`en`-kaksikielisyys ilman raakoja käännösavaimia) — `LanguageContext.tsx`
- **UI-5** (0 TypeScript- ja ESLint-virhettä/varoitusta) — `src/Client/**`
- **UI-6** (kaikkien 8 laitteen aikataulumatriisi ja `Drag-to-Select`) — `BookingCalendar.tsx`

## Hyväksymiskriteerit

1. **Given:** käyttäjä ei ole kirjautunut sisään. **When:** sivu avataan. **Then:** näytetään `LandingPage`, ja yläpalkissa on ainoastaan virallinen Xamk-logo (`xamk_logo_tiivis_kehys_keltainen_rgb.png`), kielenvaihtaja ja `Kirjaudu sisään` -painike (ei navigaatiovälilehtiä).
2. **Given:** käyttäjä on kirjautunut sisään ja avaa `/book`-näkymän. **When:** hän katsoo "Päivän varaukset ja aikataulu" -osiota. **Then:** aikataulumatriisi listaa kaikki 8 pelipistettä (`Nintendo Switch`, `PC 1`–`PC 6`, `PlayStation 5`) omilla riveillään.
3. **Given:** `PC 2` on vapaa klo 10:00–13:00. **When:** käyttäjä painaa hiiren pohjaan `PC 2`:n solussa `10:00`, vetää kursorin soluun `12:00` ja vapauttaa hiiren. **Then:** `PC 2` valitaan aktiiviseksi laitteeksi, alkamisajaksi päivittyy `10:00` ja päättymisajaksi `13:00`.
4. **Given:** `PlayStation 5` on varattu klo 14:00–16:00. **When:** käyttäjä katsoo aikataulumatriisia samalle päivälle. **Then:** sekä `PlayStation 5`:n että `Nintendo Switch`:n solut klo `14:00` ja `15:00` näkyvät varattuina (`slot-td-busy`) yhteisen TV:n vuoksi.
5. **Given:** käyttäjä vaihtaa kielen `Suomi` ↔ `English`. **When:** hän avaa minkä tahansa näkymän tai modaalin (`IssueReportModal`, `LoginModal`, `FloorPlanModal`). **Then:** kaikki otsikot, kenttien nimet ja painikkeet näkyvät valitulla kielellä ja alapalkissa näkyy Xamkin neljä kampusta (`Kotka • Kouvola • Mikkeli • Savonlinna`).

## Ei-tavoitteet

- Ei erillistä natiivia mobiilisovellusta (responsiivinen web-sovellus kattaa mobiilikäytön).
- Ei ulkoista CSS-in-JS-ajonaikaista kirjastoa; tyylit pohjautuvat Tailwind v4:ään, `shadcn/ui`-primitiiveihin ja `src/Client/src/index.css`-teemaan.

## Tehtävät

1. **UI-primitiivit (`src/Client/src/components/ui/`) ja `index.css`:** `shadcn/ui`-komponentit (`Button`, `Dialog`, `DropdownMenu`, `Tabs`, `Table`, `Card`, `Badge`, `Input`, `Textarea`, `NativeSelect`, `Label`) Xamk-brändin väreillä ja kontrasteilla. Valmis kun komponentit kääntyvät virheittä.
2. **URL-reititys (`src/Client/src/router.tsx`) ja yläpalkki (`Navbar.tsx`, `LandingPage.tsx`):** Polut kaikille näkymille ja kirjautumattoman tilan navigaatiolukitus (`UI-1`, `UI-3`).
3. **Varauskalenteri ja 8 laitteen `Drag-to-Select`-aikataulumatriisi (`BookingCalendar.tsx`):** Kaikkien laitteiden rivit ja hiirellä maalattava aikaväli (`UI-2`, `UI-6`).
4. **Modaalit ja Admin/SuperAdmin-hallintapaneelit (`IssueReportModal.tsx`, `LoginModal.tsx`, `FloorPlanModal.tsx`, `AdminPanel.tsx`, `SuperAdminPanel.tsx`):** Yhtenäinen Xamk-ilme ja kaksikielisyys (`UI-4`).
5. **Käännös- ja laatutarkistus (`UI-5`):** Valmis kun `npm --prefix src/Client run build && npm --prefix src/Client run lint` palauttaa exit-koodin `0` ilman yhtäkään varoitusta.

