import { AnalysisRequest, InstagramProfile } from "./types";

export const SYSTEM_PROMPT = `Jestes doswiadczonym konsultantem branzy beauty i ekspertem od marketingu salonow kosmetycznych. Analizujesz salony beauty dla zespolu BeautyRise.

Twoja analiza musi byc:
- Konkretna i oparta na danych (nie ogolnikowa)
- Praktyczna - z actionable rekomendacjami
- Uczciwa - wskazuj zarowno mocne strony jak i problemy
- Dostosowana do polskiego rynku beauty
- Oparta na faktach znalezionych w internecie i danych z Instagrama
- Odwoluj sie do konkretnych znalezionych informacji (opinie Google, strona www, konkurencja)
- Nie generuj ogolnikowych porad - kazda rekomendacja musi wynikac z konkretnej obserwacji

ZAWSZE odpowiadaj WYLACZNIE poprawnym JSON-em (bez markdown, bez komentarzy) w nastepujacym formacie:
{
  "overallScore": <number 1-10>,
  "summary": "<2-3 zdania podsumowania>",
  "categories": [
    {
      "name": "<nazwa kategorii>",
      "score": <number 1-10>,
      "findings": ["<obserwacja 1>", "<obserwacja 2>", ...],
      "recommendations": ["<rekomendacja 1>", "<rekomendacja 2>", ...]
    }
  ],
  "actionPlan": [
    {
      "priority": "high|medium|low",
      "area": "<obszar>",
      "action": "<konkretne dzialanie>",
      "expectedImpact": "<oczekiwany efekt>"
    }
  ]
}`;

export function buildResearchPrompt(request: AnalysisRequest): string {
  return `Jestes badaczem rynku beauty w Polsce. Przeprowadz doglebne wyszukiwanie informacji o nastepujacym salonie:

Nazwa: ${request.salonName}
Instagram: @${request.instagramHandle}
${request.problemDescription ? `Kontekst od klienta: ${request.problemDescription}` : ""}

Wyszukaj i opisz DOKLADNIE:
1. Strone internetowa salonu (jesli istnieje) - jakie uslugi oferuja, cennik, system rezerwacji online
2. Opinie Google - srednia ocena, liczba opinii, najczestsze komentarze pozytywne i negatywne
3. Obecnosc na platformach rezerwacyjnych (Booksy, Moment.pl, Fresha itp.) - czy maja profil, ile opinii, jakie uslugi
4. Profil na Facebooku - czy jest aktywny, ile ma polubien/obserwujacych
5. Konkurencja w okolicy - jakie inne salony beauty dzialaja w tej samej lokalizacji, jak sie pozycjonuja
6. Wszelkie wzmianki w mediach, blogach, portalach branzy beauty
7. Cennik i pozycjonowanie cenowe vs konkurencja (jesli dane dostepne)
8. Obecnosc w Google Maps / Google Business Profile

Podaj KONKRETNE fakty i dane znalezione w internecie. Cytuj zrodla.
Jesli czegos nie znajdziesz, napisz ze nie znaleziono - NIE WYMYSLAJ informacji.`;
}

export function buildUserPrompt(
  request: AnalysisRequest,
  instagramData: InstagramProfile | null,
  researchResults: string = ""
): string {
  const igSection = instagramData
    ? formatInstagramData(instagramData)
    : "Dane z Instagrama niedostepne - analizuj na podstawie pozostalych informacji.";

  const researchSection = researchResults
    ? researchResults
    : "Brak danych z wyszukiwania internetowego.";

  return `## Informacje o salonie
- Nazwa: ${request.salonName}
- Instagram: @${request.instagramHandle}
- Opis problemu: ${request.problemDescription}
- Kategorie problemow: ${request.problemCategories.join(", ") || "Nie wybrano"}
${request.contactName ? `- Imie klienta: ${request.contactName}` : ""}

## Dane z Instagrama
${igSection}

## Wyniki badania internetowego
${researchSection}

## Instrukcje analizy

WAZNE: Twoja analiza MUSI opierac sie na faktach znalezionych w badaniu internetowym i danych z Instagrama. Nie generuj ogolnikowych porad - odwoluj sie do konkretnych obserwacji z profilu i znalezionych informacji online.

Przeanalizuj ten salon w nastepujacych kategoriach. Dla kazdej podaj ocene (1-10), obserwacje i rekomendacje:

### 1. Marketing & Social Media
- Optymalizacja profilu (bio, link, highlights, CTA)
- Jakosc contentu i spojnosc wizualna
- Czestotliwosc i strategia postowania
- Engagement rate (lajki + komentarze / followersow)
- Strategia hashtagow i opisow
- Spojnosc marki w postach
- Wykorzystanie Stories i Reels

### 2. Biznes & Operacje
- Ocena oferty uslug (na podstawie postow/bio)
- Pozycjonowanie cenowe
- Klarownosc grupy docelowej
- Pozycja konkurencyjna
- Sciezka klienta (rezerwacja, komunikacja, follow-up)
- Obecnosc online poza Instagramem

### 3. Identyfikacja Wizualna & Branding
- Spojnosc palety kolorow
- Jakosc fotografii
- Efektywnosc contentu before/after
- Logo i elementy brandingu
- Ogolna koherencja estetyczna

### 4. Wzrost & Pozyskiwanie Klientow
- Potencjal generowania leadow
- Wskazniki polecen i social proof
- Sygaly local SEO
- Mozliwosci wspolprac i partnerstw
- Wskazniki retencji klientow

Podaj minimum 3 obserwacje i 3 rekomendacje per kategoria.
Plan dzialania powinien zawierac minimum 6 pozycji posortowanych wg priorytetu.`;
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
