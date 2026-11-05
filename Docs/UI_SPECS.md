# Xamk Game Room – UI & Visuaalinen Spesifikaatio (`UI_SPECS.md`)

Tämä dokumentti määrittelee Xamk Game Room (Pelihuonevaraus) -sovelluksen virallisen käyttöliittymäarkkitehtuurin, visuaalisen Cockpit-designjärjestelmän, komponenttivastuut sekä vuorovaikutussäännöt.

**Tämä dokumentti on sovelluksen käyttöliittymän ainoa virallinen totuuden lähde (Single Source of Truth). Jokaisen UI-muutoksia tekevän kehittäjän ja tekoälyagentin on noudatettava näitä ohjeita ehdottomasti.**

---

## 1. EHDOTTOMAT ARKKITEHTONISET PERUSSÄÄNNÖT (Non-Negotiable Invariants)

### 1.1 Nollatoleranssi toiminnallisille regressioille (Zero Functional Regressions)
- **Visuaalinen tai tyylillinen muutos EI SAA KOSKAAN rikkoa, muuttaa tai poistaa olemassa olevaa sovelluslogiikkaa.**
- Kaikki olemassa olevat toiminnot on säilytettävä:
  - Komponenttien propsit ja niiden tyypit
  - Tapahtumankäsittelijät (`onClick`, `onSubmit`, `onSelectStationTime`, `onSelectSlot` jne.)
  - React-tilat (`useState`, `@tanstack/react-query`, `useContext`)
  - Validointisäännöt (30 min askeleet, max 4h varaus, päällekkäisyyksien esto, aukioloajat 08:00–18:00)
  - Modaalien ja dialogien avaus- ja sulkukutsut (`isOpen`, `onClose`)
  - Roolipohjainen näkyvyys (User, Admin, SuperAdmin)

### 1.2 Täydellinen emojien puhdistus (Zero Cartoon Emojis)
- **Kaikki sarjakuvamaiset hymiöt ja emojit ovat ehdottomasti kiellettyjä:**
  - Ei emojipohjaisia ikoneita koodissa, käyttöliittymässä, tietokantakuvauksissa eikä käännöksissä.
  - Kaikki visuaaliset symbolit toteutetaan poikkeuksetta **Lucide React** -vektori-ikoneilla (`lucide-react`).

### 1.3 Korkearesoluutioiset grafiikka- ja brändiasetit
- Tekstejä, nappeja, laatikoita tai logoja ei koskaan leikata epätarkoista rasterimockupeista.
- **Logot:**
  - Virallinen Xamk-tunnus: `/xamk-hero-logo.png`
  - Virallinen geometrinen X-symboli: `/xamk-x-logo.png` tai vastaava terävä SVG-toteutus ([`XamkLogo.tsx`](file:///src/Client/src/components/XamkLogo.tsx))
- **Hero-taustakuva:**
  - Korkearesoluutioinen (1920×1080) puhdistettu valokuva pelitilasta: `/gaming-room-banner.jpg`
  - Taustan päällä käytetään pehmeää tummennusgradienttia (`bg-gradient-to-r from-black/85 via-black/60 to-transparent`).

### 1.4 Monikielisyys (i18n) pakollinen
- Kaikki tekstit haetaan `useLanguage()` -hookin kautta: `t('avain')`.
- Kovakoodatut inline-ehdot (esim. `isEn ? '...' : '...'`) ovat kiellettyjä. Kaikki tekstit määritellään tiedostossa [`LanguageContext.tsx`](file:///src/Client/src/context/LanguageContext.tsx) sekä `fi`- että `en`-kielille.

### 1.5 Laitteiden nimeämisstandardi (Station Nomenclature)
- Tietokoneet nimetään yhtenäisesti ilman ylimääräisiä markkinointitermejä: **"PC 1" – "PC 6"** (ei "RTX Gaming PC").
- Konsolit: **"Nintendo Switch"** ja **"PlayStation 5"**.

### 1.6 Footerin teksti ja linkitykset
- Alapalkissa käytetään aina virallista oppilaitos- ja tilatunnusta:
  `Kaakkois-Suomen ammattikorkeakoulu • Xamk Game Room`
- Alapalkista on poistettu vanhentunut "Xamk Esports" -teksti.

---

## 2. COCKPIT-VISUAALINEN DESIGNJÄRJESTELMÄ & VÄRITOKENIT

Käyttöliittymä noudattaa huippumodernia **"Cockpit Dark Gaming Lounge"** -värijärjestelmää, joka perustuu kolmitasoiseen kontrastirakenteeseen:

```
┌──────────────────────────────────────────────────────────────┐
│ Taso 1: Pikimusta kehys (Navbar, Hero-ulkoalue, Footer)       │  #0a0b0d
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Taso 2: Slate Gray -keskikangas (Pääsisältöalue)          │ │  #23262d
│ │ ┌──────────────────────┐    ┌──────────────────────────┐ │ │
│ │ │ Taso 3: Kortit/Lomake│    │ Taso 3: Aikamatriisi     │ │ │  #181a20 / #14161f
│ │ │ (#181a20)            │    │ (#181a20)                │ │ │
│ │ └──────────────────────┘    └──────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 Väripaletti ja kontrastitasot

| Kerros / Tarkoitus | HEX-koodi | Tailwind-luokat / Huomiot |
|---|---|---|
| **Taso 1: Kehys & palkit** | `#0a0b0d` / `#0d0f13` | Navbar, Footer ja sivun äärimmäinen tausta. |
| **Taso 2: Keskikangas** | `#23262d` | `bg-[#23262d] border-y border-[#181a20]`: Tuo ratkaisevan kontrastieron taustan ja korttien välille. |
| **Taso 3: Kortit ja paneelit** | `#181a20` / `#14161f` | `bg-[#181a20] border-[#2d323f]` tai `border-[#363c4a]`. |
| **Pääväri (Xamk Kulta/Keltainen)** | `#fbba18` | Painikkeet, aktiiviset välilehdet, otsikkotaustat, varausaika-indikaattori. |
| **Päävärin hover/tumma** | `#d89619` | `hover:bg-[#d89619]` interaktiivisille elementeille. |
| **Tila: Vapaa** | `#10b981` | Emerald: `bg-emerald-500/20 text-emerald-300 border-emerald-500/30` |
| **Tila: Varattu** | `#ef4444` | Rose: `bg-rose-500/20 text-rose-300 border-rose-500/30` |
| **Tila: Jaettu TV varattu** | `#f59e0b` | Amber: `bg-amber-500/20 text-amber-300 border-amber-500/30` |
| **Aikamatriisin oma valinta** | `#fbba18` | `bg-amber-400 text-black shadow-lg font-bold ring-2 ring-amber-300` |

---

## 3. SIVURAKENNE JA NÄKYMÄARKITEHTUURI

### 3.1 Kirjautumattoman käyttäjän näkymä (`LandingPage.tsx`)

Landing Page on suunniteltu puhtaaksi ja nopeaksi ensikosketukseksi ilman turhaa tilantäytettä:

1. **Virtaviivainen Landing Header:**
   - Brändi: Xamk-logo + `PELIHUONEVARAUS / XAMK GAME ROOM`.
   - **Vain 3 keskeistä toimintonappia:**
     1. `Tilan tilanne` (avaa tilan tilanteen suoraan modaalina)
     2. `Tilan pohjakuva` (avaa pohjakuvamodaalin)
     3. `Säännöt ja ohjeet` (avaa sääntömodallin)
   - Oikealla kielivalitsin (FI/EN) ja kultainen `Kirjaudu` -painike.
   - Mobiilissa napakka `Kirjaudu`-painike ja 48px hampurilaisvalikko oikealle ankkuroituna (`flex-shrink-0`).

2. **HeroBanner:**
   - Tiivis, selkeä yläbanneri pelitilakuvalla.
   - Otsikkolaatikko: *"Tervetuloa Xamk Game Roomiin"*.
   - Cockpit-tilapaneeli: Aukioloajat (ma–pe 08:00–18:00) ja live-aukiolotieto.
   - *Poistettu: Pitkät toistuvat leipätekstit ja toistuvat ammattikorkeakoulupillerit.*

3. **Pääsisältö:**
   - **Vasen sarake:** Tilan tiedotteet, pikalinkit ja aukiolotiedot.
   - **Oikea sarake:** Sisäänkirjautumislaatikko (sähköpostiosoite + OTP-koodi sekä kehitysympäristön pikanapit).
   - *Poistettu: Erillinen "Tilan pelisäännöt lyhyesti" -kortti (säännöt löytyvät ylävalikosta) sekä alaosan duplikaattinapit pohjakuvaan ja Discordiin.*

4. **Footer:**
   - Yhtenäinen tumma alatunniste ilman "Xamk Esports" -tekstiä.

---

### 3.2 Kirjautuneen käyttäjän Dashboard (`App.tsx` & Cockpit)

Kun käyttäjä kirjautuu sisään, avautuu täysi kaksisarakkeinen Cockpit-hallintanäkymä:

#### 1. Yläpalkki (`Navbar.tsx`)
- Kiinteä korkeus 64px (`h-16`), pikimusta pohja (`#0a0b0d`), reuna `#23262d`.
- **Brändiosio:** Xamk-logo sekä otsikot `PELIHUONEVARAUS` ja `XAMK GAME ROOM`. Skaalattu mobiilissa siten, ettei teksti katkea tai katoa pienilläkään näytöillä (360px+).
- **Navigaatio (Desktop):**
  - Varaa laite (`book`)
  - Tilan tilanne (`status`)
  - Pelit & toivelista (`games`)
  - Säännöt & ohjeet (`rules`)
  - Pohjakuva (modaalilinkki)
  - Discord (ulkoinen linkki)
  - Omat varaukset (`my-bookings`)
  - Admin / SuperAdmin (ehdollinen roolin mukaan)
- **Oikea reuna:**
  - Ilmoita vika (`Bug`-ikoni)
  - Kielivalitsin (FI / EN)
  - Käyttäjäbadge ja rooli (`User`, `Admin`, `SuperAdmin`)
  - Uloskirjautumispainike
- **Mobiilituki:**
  - Kaikki painikkeet täyttävät 48px kosketusalueen (`min-h-[48px]`).
  - Hampurilaisvalikko aukeaa pehmeästi animoituun tummaan mobiilivalikkodraweriin.

#### 2. HeroBanner (`HeroBanner.tsx`)
- Puhdas ja ilmava korkearesoluutioinen banneri.
- Vasemmalla Xamk-kullanvärinen laatikko: *"Tervetuloa Xamk Game Roomiin"*.
- Oikealla lasipaneeli aukioloajoilla ja Xamk X -tunnuksella.

#### 3. Cockpit-pääasettelu (Kaksisarakkeinen työpöytänäkymä, allekkain mobiilissa)

##### Vasen sarake: Varauslomake (`BookingCalendar.tsx`)
- Varaustyypit: **Yksittäinen pelaaja** (1 laite), **Koko tila** (LAN/tiimit), **Tapahtuma**.
- Päivämäärävalitsin:
  - Natiivi kalenteripainike (`[color-scheme:dark]`).
  - Kalenterikuvakkeen tai tekstikentän klikkaus kutsuu `showPicker()` -metodia ja avaa selaimen natiivin kalenterin.
- Aika-alueen valitsimet (Alkamisaika ja Päättymisaika 08:00–18:00 puolen tunnin välein).
- **Kaksisuuntainen synkronointi:** Ajan tai laitteen valinta lomakkeella päivittyy välittömästi viereiseen aikamatriisiin, ja aikamatriisista hiirellä/kosketuksella tehty valinta päivittää suoraan lomakkeen kentät.
- Pääpainike: Kultainen pyöristetty painike *"Vahvista varaus →"*.

##### Oikea sarake: Aikamatriisi ja aikataulu (`DailyScheduleViewer.tsx`)
- **Option A -arkkitehtuuri:** Komponentti on lukittu horisontaaliseen aikajananäkymään (`lockViewMode="timeline"`). Turha kahdeksan kortin duplikaattiruudukko on poistettu, mikä maksimoi tilankäytön ja selkeyden.
- **Yläpalkki:**
  - Päivämäärän selaus (edellinen / seuraava päivä).
  - Päivämääräkenttä natiivilla kalenterinavausikonilla (`showPicker()`).
  - Päivitä-painike yhtenäisellä tyylillä: ikoni + teksti **"Päivitä"** (`px-3 py-1.5 rounded-xl bg-[#111318] hover:bg-[#1f222b]`).
  - Ei hymiöitä päivämäärän tai otsikoiden yhteydessä.

---

## 4. INTERAKTIIVINEN AIKAMATRIISI & DRAG-TO-SELECT -SPESIFIKAATIO

Käyttäjä voi valita varausajan suoraan aikamatriisista vetämällä hiirellä tai pyyhkäisemällä kosketusnäytöllä.

### 4.1 Rakenne ja sarakkeet
- **Rivit:** 8 pelipistettä (PC 1–6, Nintendo Switch, PlayStation 5).
- **Sarakkeet:** 20 kpl 30 minuutin aikajaksoja välillä 08:00–18:00.
- **Responsiivisuus:** Aikajanalla on `min-w-[650px]` ja `overflow-x-auto`, jolloin se rullaa sujuvasti mobiilinäytöillä ilman asettelun rikkoutumista.

### 4.2 PointerEvents-ohjauslogiikka
Toteutettu natiivilla W3C Pointer Events API:lla (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`):

1. **Aloitus (`onPointerDown`):**
   - Tunnistaa klikatun laiterivin (`stationId`) ja puolituntisen aloitussarakkeen (`startHour`).
   - Kutsuu `e.currentTarget.setPointerCapture(e.pointerId)`, mikä takaa tapahtumien kiinnittymisen riviin, vaikka osoitin liikkuisi komponentin ulkopuolelle.
   - Estää mobiiliselaimen sivunvierityksen riviltä (`touch-action: none`).
2. **Liike (`onPointerMove`):**
   - Laskee osoittimen X-koordinaatista kohdesarakkeen suhteessa rivin leveyteen (`getBoundingClientRect()`).
   - Pyöristää automaattisesti 30 minuutin jaksoihin.
   - **Maksimiaikarajoitus:** Rajoittaa vedon keston enintään 4.0 tuntiin (8 lohkoa).
   - **Törmäyksenesto (Collision detection):** Jos valinta osuu varattuun aikaväliin, valinta-alue katkaistaan automaattisesti juuri ennen varattua jaksoa. Päällekkäisvarausta ei voi syntyä vetämällä.
3. **Lopetus (`onPointerUp`):**
   - Vapauttaa pointer capturen (`releasePointerCapture`).
   - Lähettää valitun aikavälin lomakkeelle callbackilla: `onSelectStationTime(stationId, startHour, endHour)`.
4. **Visuaalinen palaute vedon aikana:**
   - Valinta-alue korostetaan kullanvärisellä teemalla (`bg-amber-400 text-black shadow-lg font-bold`).
   - Valinnan päällä esitetään dynaaminen kelluva badge valitusta aikavälistä ja kestosta (esim. `10:00–12:30 (2.5h)`).

---

## 5. TILAN TILANNE -NÄKYMÄ (`RealtimeStatus.tsx`)

Tilan reaaliaikainen tilannenäkymä hyödyntää samaa yhtenäistä visuaalista hierarkiaa:
1. **Yläosa:** 8 kpl suuria laitekohtaisia tilakortteja (PC 1–6, Switch, PS5), joissa näkyy laitteen tämänhetkinen tila (Vapaa / Varattu / TV-varattu) ja seuraava varaus.
2. **Alaosa:** Upotettu `DailyScheduleViewer` lukittuna horisontaaliseen aikajananäkymään (`lockViewMode="timeline"`). Tämä estää identtisten laitekorttien tuplaantumisen samalla sivulla.
3. **Päivityspainike:** Yhtenäinen `Päivitä`-nappi tekstillä ja Lucide-ikonilla.

---

## 6. MOBIILI- JA KOSKETUSOPTIMOINTI (Mobile First & Touch UX)

1. **Kosketusalueet (Touch Targets):**
   - Kaikki napit, välilehdet, sulkupainikkeet ja valikkokohteet ovat vähintään **48 × 48 px** (`min-h-[48px]`, `min-w-[48px]`).
2. **Yläpalkin skaalautuvuus:**
   - Yläpalkin bränditeksti ja logo eivät leikkaannu tai häviä edes kapeimmilla puhelinnäytöillä (360px).
   - Hampurilaisvalikko on aina ankkuroitu oikealle `flex-shrink-0` -luokalla.
3. **Kalenterisyötteet:**
   - `<input type="date">` -kentät käyttävät `[color-scheme:dark]` -luokkaa, jolloin selaimen oma kalenteripainike ja ponnahdusikkuna renderöityvät natiivina ja virheettömästi ilman päällekkäisiä leikkausvirheitä.

---

## 7. KOMPONENTTIREKISTERI JA VASTUUT

| Komponentti | Vastuu | Keskeiset propsit & toiminnot |
|---|---|---|
| [`App.tsx`](file:///src/Client/src/App.tsx) | Sovelluksen juuriohjaus, autentikaation tarkistus, modaalien hallinta ja näkymäreititys. | `activeTab`, `isLoginOpen`, `isFloorPlanOpen`, `isIssueModalOpen`. |
| [`Navbar.tsx`](file:///src/Client/src/components/Navbar.tsx) | Yläpalkki kirjautuneelle käyttäjälle, roolipohjaiset välilehdet, 48px mobiilidrawer. | `activeTab`, `setActiveTab`, `onOpenLogin`, `onOpenFloorPlan`, `onOpenIssueModal`. |
| [`LandingPage.tsx`](file:///src/Client/src/components/LandingPage.tsx) | Kirjautumattoman käyttäjän etusivu, 3-toimintoinen virtaviivainen yläpalkki, kirjautumislomake. | `onOpenLogin`, `onOpenIssueModal`, `onOpenFloorPlan`. |
| [`HeroBanner.tsx`](file:///src/Client/src/components/HeroBanner.tsx) | Tiivis 1920x1080 banneri, aukioloajat (08:00–18:00) ja aukiolotila. | Itsenäinen komponentti ilman propseja. |
| [`BookingCalendar.tsx`](file:///src/Client/src/components/BookingCalendar.tsx) | Varauslomake, varauksen vahvistus, synkronointi aikamatriisiin, natiivi `showPicker()`. | `onRequireLogin`, `onSuccessBooking`, `onOpenFloorPlan`. |
| [`DailyScheduleViewer.tsx`](file:///src/Client/src/components/DailyScheduleViewer.tsx) | Horisontaalinen aikamatriisi (08:00–18:00), interaktiivinen Drag-to-Select, natiivi kalenteri ja Päivitä-toiminto. | `lockViewMode="timeline"`, `selectedStationId`, `selectedStartHour`, `selectedEndHour`, `onSelectStationTime`. |
| [`RealtimeStatus.tsx`](file:///src/Client/src/components/RealtimeStatus.tsx) | Reaaliaikainen laitetilanne (8 laitekorttia) + Option A aikamatriisi. | `onOpenFloorPlan`, `onNavigateToBooking`. |
| [`FloorPlanModal.tsx`](file:///src/Client/src/components/FloorPlanModal.tsx) | Interaktiivinen tilan pohjakuva laitesijoitteluineen. | `isOpen`, `onClose`. |
| [`IssueReportModal.tsx`](file:///src/Client/src/components/IssueReportModal.tsx) | Vikailmoituslomake laitekohtaisilla valinnoilla. | `isOpen`, `onClose`. |
| [`Footer.tsx`](file:///src/Client/src/components/Footer.tsx) | Tumma alatunniste, oppilaitostiedot ja pikalinkit (ilman Esports-tekstiä). | `onOpenIssueModal`, `onOpenFloorPlan`, `onNavigateTab`. |

---

## 8. KEHITYSTYÖN TARKISTUSLISTA (Verification Checklist)

Ennen kuin koodimuutoksia merkitään valmiiksi, suorita seuraava tarkistuslista:

1. [ ] **Toiminnallisuus:** Toimiiko varauksen tekeminen ja peruutus täysin oikein?
2. [ ] **Emojit:** Onko käyttöliittymä, koodi ja käännökset 100 % vapaa sarjakuvamaisista hymiöistä?
3. [ ] **Drag-to-Select:** Toimiiko hiirellä vetäminen ja puhelimella pyyhkäisy aikamatriisissa ilman sivun vierimistä?
4. [ ] **Mobiili:** Ovatko kaikki kosketuspinnat vähintään 48px eikä mikään otsikko leikkaannu?
5. [ ] **i18n:** Onko uusille teksteille käännökset sekä suomeksi että englanniksi `LanguageContext.tsx`:ssä?
6. [ ] **Build:** Kääntyykö TypeScript ja Vite virheettömästi:
   ```bash
   cd src/Client
   npm run build
   ```
