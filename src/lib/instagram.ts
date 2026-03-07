import { InstagramProfile } from "./types";

function extractUsername(input: string): string {
  let handle = input.trim();
  handle = handle.replace(/^https?:\/\/(www\.)?instagram\.com\//, "");
  handle = handle.replace(/^@/, "");
  handle = handle.replace(/\/$/, "");
  handle = handle.split("?")[0];
  return handle;
}

function parseCount(text: string): number {
  const cleaned = text.replace(/,/g, "").trim();
  const match = cleaned.match(/([\d.]+)\s*([KMB]?)/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  if (suffix === "K") return Math.round(num * 1000);
  if (suffix === "M") return Math.round(num * 1000000);
  if (suffix === "B") return Math.round(num * 1000000000);
  return Math.round(num);
}

export async function scrapeInstagram(
  handleOrUrl: string
): Promise<InstagramProfile | null> {
  const username = extractUsername(handleOrUrl);
  if (!username) return null;

  try {
    const response = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error("Instagram fetch failed:", response.status);
      return null;
    }

    const html = await response.text();
    return parseProfileFromHtml(html, username);
  } catch (error) {
    console.error("Instagram scraping failed:", error);
    return null;
  }
}

function parseProfileFromHtml(html: string, username: string): InstagramProfile | null {
  const getMeta = (property: string): string => {
    const regex = new RegExp(`<meta\\s+(?:property|name)=["']${property}["']\\s+content=["']([^"']*)["']`, "i");
    const altRegex = new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+(?:property|name)=["']${property}["']`, "i");
    const match = html.match(regex) || html.match(altRegex);
    return match ? match[1] : "";
  };

  const title = getMeta("og:title");
  const description = getMeta("og:description") || getMeta("description");
  const profilePic = getMeta("og:image");

  if (!description && !title) return null;

  // Parse description: "123 Followers, 456 Following, 789 Posts - Bio text"
  // or: "123 followers, 456 following, 789 posts - Bio"
  let followersCount = 0;
  let followingCount = 0;
  let postsCount = 0;
  let bio = "";

  const followersMatch = description.match(/([\d,.]+[KMB]?)\s*Followers/i);
  const followingMatch = description.match(/([\d,.]+[KMB]?)\s*Following/i);
  const postsMatch = description.match(/([\d,.]+[KMB]?)\s*Posts/i);

  if (followersMatch) followersCount = parseCount(followersMatch[1]);
  if (followingMatch) followingCount = parseCount(followingMatch[1]);
  if (postsMatch) postsCount = parseCount(postsMatch[1]);

  // Bio is usually after the dash
  const dashIndex = description.indexOf(" - ");
  if (dashIndex !== -1) {
    bio = description.substring(dashIndex + 3).trim();
    // Remove trailing quotes
    bio = bio.replace(/^["']|["']$/g, "").trim();
  }

  const fullName = title
    ? title.replace(/\s*\(@[^)]+\).*$/, "").replace(/\s*•\s*Instagram.*$/, "").trim()
    : "";

  return {
    username,
    fullName,
    bio,
    followersCount,
    followingCount,
    postsCount,
    isVerified: false,
    profilePicUrl: profilePic,
    recentPosts: [],
  };
}
