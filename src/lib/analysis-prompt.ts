import { AnalysisRequest, InstagramProfile } from "./types";

export const SYSTEM_PROMPT = `Jestes Senior Partnerem w firmie consultingowej specjalizujacej sie w branzy beauty i wellness. Stosujesz metodologie wiodacych firm consultingowych (McKinsey, BCG, Bain) w analizie salonow kosmetycznych.

## Twoja metodologia

### Zasada Piramidy (Pyramid Principle)
Rozpocznij od konkluzji w Executive Summary, nastepnie wspieraj ja argumentami i danymi. Struktura SCR:
- Situation: obecny stan salonu (fakty)
- Complication: zidentyfikowany problem/wyzwanie
- Resolution: glowna rekomendacja strategiczna

### Podejscie hipotezowe (Hypothesis-Driven)
Dla kazdej kategorii analizy:
1. Sformuluj hipoteze na podstawie dostepnych danych
2. Przedstaw dowody (evidence) potwierdzajace lub obalajace hipoteze
3. Wyciagnij wnioski (findings) oparte na dowodach
4. Podaj rekomendacje wynikajace bezposrednio z wnioskow

### Dekompozycja MECE (Mutually Exclusive, Collectively Exhaustive)
Analizuj salon w 5 wzajemnie wykluczajacych sie kategoriach:
1. Pozyskiwanie Klientow (Acquisition)
2. Doswiadczenie Klienta (Experience)
3. Retencja i Lojalnosc (Retention)
4. Marka i Pozycjonowanie (Brand)
5. Operacje i Efektywnosc (Operations)

### SWOT Analysis
Obowiazkowo przeprowadz analize SWOT oparta na faktach.

### Plan dzialania w 3 fazach (Bain Results Delivery)
- Quick Wins (0-30 dni): natychmiastowe, niskokosztowe dzialania
- Core Changes (1-3 miesiace): kluczowe zmiany wymagajace planowania
- Transformation (3-6 miesiecy): strategiczne inicjatywy dlugoterminowe

### KPIs
Zdefiniuj mierzalne metryki sukcesu z wartoscia obecna (lub szacunkowa) i docelowa.

## Zasady analizy
- Opieraj sie WYLACZNIE na faktach z danych (Instagram, research internetowy)
- NIE WYMYSLAJ informacji — jesli brak danych, napisz ze nie znaleziono
- Kazda rekomendacja musi wynikac z konkretnej obserwacji
- Uzywaj jezykow polskiego
- Badz bezposredni i konkretny — zero ogolnikow

ZAWSZE odpowiadaj WYLACZNIE poprawnym JSON-em.`;

export function buildResearchPrompt(request: AnalysisRequest): string {
  const websiteNote = request.websiteUrl
    ? `Strona www: ${request.websiteUrl} — wyszukaj ja i opisz zawartosc (uslugi, cennik, rezerwacje, UX).`
    : `Wyszukaj strone internetowa salonu "${request.salonName}" jesli istnieje.`;

  return `Jestes badaczem rynku beauty w Polsce. Masz dostep do wyszukiwarki Google — KORZYSTAJ z niej aktywnie.

## Salon do zbadania
Nazwa: ${request.salonName}
Instagram: @${request.instagramHandle}
${websiteNote}
${request.problemDescription ? `Kontekst od klienta: ${request.problemDescription}` : ""}

## INSTRUKCJE
Wyszukaj w Google nastepujace zapytania i opisz co FAKTYCZNIE znalazles:

### 1. Wyszukaj: "${request.salonName}" salon
- Strona internetowa: URL, uslugi, cennik, system rezerwacji
- Google Business Profile: ocena gwiazdkowa, liczba opinii, przykladowe opinie (+/-)
- Booksy / Moment.pl / Fresha: czy istnieje profil, opinie
- Facebook: czy istnieje fanpage, ile polubien
- TikTok, YouTube, blog: czy istnieja

### 2. Wyszukaj: "${request.salonName}" opinie
- Zbierz prawdziwe opinie klientow z roznych zrodel
- Podsumuj najczestsze pozytywy i negatywy

### 3. Wyszukaj: salon kosmetyczny + lokalizacja (jesli mozesz ustalic z nazwy/IG)
- 3-5 konkurentow w okolicy z ich ocenami Google
- Porownanie cen i oferty

### 4. Wyszukaj: @${request.instagramHandle} instagram
- Opis profilu, liczba obserwujacych, rodzaj tresci

## ZASADY
- Podaj TYLKO informacje ktore faktycznie znalazles w wyszukiwarce
- Przy kazdej informacji podaj zrodlo (URL lub nazwa platformy)
- Jesli czegos NIE ZNALAZLES — napisz wyraznie "Nie znaleziono" zamiast wymyslac
- NIE GENERUJ fikcyjnych danych, ocen ani opinii`;
}

export function buildUserPrompt(
  request: AnalysisRequest,
  instagramData: InstagramProfile | null,
  researchResults: string = "",
  websiteContent: string = ""
): string {
  const igSection = instagramData
    ? formatInstagramData(instagramData)
    : "Dane z Instagrama niedostepne - analizuj na podstawie pozostalych informacji.";

  const researchSection = researchResults
    ? researchResults
    : "Brak danych z wyszukiwania internetowego.";

  const websiteSection = websiteContent
    ? websiteContent
    : "Strona www niedostepna lub nie podano adresu.";

  return `## Informacje o salonie
- Nazwa: ${request.salonName}
- Instagram: @${request.instagramHandle}
${request.websiteUrl ? `- Strona www: ${request.websiteUrl}` : ""}
- Opis problemu: ${request.problemDescription}
- Kategorie problemow: ${request.problemCategories.join(", ") || "Nie wybrano"}
${request.contactName ? `- Imie klienta: ${request.contactName}` : ""}

## Dane z Instagrama
${igSection}

## Zawartosc strony internetowej
${websiteSection}

## Wyniki badania internetowego (z Google Search)
${researchSection}

## Instrukcje analizy

Przeprowadz analize consultingowa wedlug metodologii opisanej w system prompt.

### Kategorie analizy (MECE)

#### 1. Pozyskiwanie Klientow (Acquisition)
Hipoteza do przetestowania: "Salon [nie] wykorzystuje efektywnie dostepne kanaly pozyskiwania klientow"
- Widocznosc w Google (SEO, Google Maps, Google Business)
- Skutecznosc social media (zasieg, engagement, konwersja)
- Reklama platna i organiczna
- Program poleceń i referral marketing
- Wspolprace i partnerstwa lokalne

#### 2. Doswiadczenie Klienta (Experience)
Hipoteza: "Sciezka klienta od pierwszego kontaktu do wizyty [nie] jest zoptymalizowana"
- Latwosc rezerwacji (online, telefon, DM)
- Pierwsze wrazenie (profil online, strona, odpowiedz na zapytania)
- Jakosc obslugi i komunikacji
- Opinie klientow (Google, Booksy, Facebook)
- Follow-up po wizycie

#### 3. Retencja i Lojalnosc (Retention)
Hipoteza: "Salon [nie] posiada strategie utrzymania klientow i budowania lojalnosci"
- Wskazniki powracajacych klientow (jesli dane dostepne)
- Programy lojalnosciowe
- Komunikacja z baza klientow (newsletter, SMS, social)
- Personalizacja uslug
- Upselling i cross-selling

#### 4. Marka i Pozycjonowanie (Brand)
Hipoteza: "Marka salonu [nie] jest czytelna i wyroznia sie na tle konkurencji"
- Spojnosc wizualna (logo, kolory, feed IG)
- USP (Unique Selling Proposition) — co wyrożnia salon
- Pozycjonowanie cenowe vs konkurencja
- Komunikacja wartosci marki
- Content marketing i storytelling

#### 5. Operacje i Efektywnosc (Operations)
Hipoteza: "Procesy operacyjne salonu [nie] wspieraja efektywne dzialanie i skalowanie"
- Narzedzia cyfrowe (rezerwacje, CRM, marketing automation)
- Obecnosc na platformach rezerwacyjnych
- Strona internetowa i jej funkcjonalnosc
- Automatyzacja procesow
- Potencjal skalowania

### Wymagania
- Minimum 3 dowody (evidence) per kategoria
- Minimum 3 obserwacje (findings) per kategoria
- Minimum 3 rekomendacje per kategoria (konkretne, actionable, SMART)
- SWOT: minimum 3 pozycje per kwadrant
- Plan dzialania: minimum 2 Quick Wins, 3 Core Changes, 2 Transformation
- KPIs: minimum 4 metryki z wartoscia obecna i docelowa`;
}

function formatInstagramData(profile: InstagramProfile): string {
  const engagementRate =
    profile.followersCount > 0 && profile.recentPosts.length > 0
      ? (
          (profile.recentPosts.reduce(
            (sum, p) => sum + p.likesCount + p.commentsCount,
            0
          ) /
            profile.recentPosts.length /
            profile.followersCount) *
          100
        ).toFixed(2)
      : "N/A";

  const postFrequency = calculatePostFrequency(profile.recentPosts);

  return `### Profil
- Nazwa: ${profile.fullName}
- Username: @${profile.username}
- Bio: ${profile.bio}
- Followers: ${profile.followersCount.toLocaleString()}
- Following: ${profile.followingCount.toLocaleString()}
- Liczba postow: ${profile.postsCount.toLocaleString()}
- Zweryfikowany: ${profile.isVerified ? "Tak" : "Nie"}
- Link zewnetrzny: ${profile.externalUrl || "Brak"}
- Engagement rate (sredni): ${engagementRate}%
- Czestotliwosc postowania: ${postFrequency}

### Ostatnie posty (${profile.recentPosts.length})
${profile.recentPosts
  .map(
    (post, i) =>
      `${i + 1}. [${post.type}] Lajki: ${post.likesCount}, Komentarze: ${post.commentsCount}
   Opis: ${post.caption.slice(0, 200)}${post.caption.length > 200 ? "..." : ""}`
  )
  .join("\n")}`;
}

function calculatePostFrequency(posts: InstagramProfile["recentPosts"]): string {
  if (posts.length < 2) return "Niewystarczajace dane";

  const timestamps = posts
    .map((p) => new Date(p.timestamp).getTime())
    .filter((t) => !isNaN(t))
    .sort((a, b) => b - a);

  if (timestamps.length < 2) return "Niewystarczajace dane";

  const daysBetween =
    (timestamps[0] - timestamps[timestamps.length - 1]) /
    (1000 * 60 * 60 * 24);
  const postsPerWeek = ((timestamps.length - 1) / daysBetween) * 7;

  if (postsPerWeek >= 7) return `~${Math.round(postsPerWeek)} postow/tydzien (codziennie)`;
  if (postsPerWeek >= 3) return `~${Math.round(postsPerWeek)} postow/tydzien`;
  if (postsPerWeek >= 1) return `~${Math.round(postsPerWeek)} post/tydzien`;
  return `Mniej niz 1 post/tydzien`;
}
