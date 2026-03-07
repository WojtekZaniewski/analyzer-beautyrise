import { InstagramProfile, InstagramPost } from "./types";

function extractUsername(input: string): string {
  let handle = input.trim();
  // Remove URL prefix
  handle = handle.replace(/^https?:\/\/(www\.)?instagram\.com\//, "");
  // Remove @ prefix
  handle = handle.replace(/^@/, "");
  // Remove trailing slash
  handle = handle.replace(/\/$/, "");
  // Remove query params
  handle = handle.split("?")[0];
  return handle;
}

export async function scrapeInstagram(
  handleOrUrl: string
): Promise<InstagramProfile | null> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    console.warn("APIFY_API_TOKEN not set, skipping Instagram scraping");
    return null;
  }

  const username = extractUsername(handleOrUrl);
  if (!username) return null;

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [username],
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!response.ok) {
      console.error("Apify API error:", response.status);
      return null;
    }

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const profile = data[0];
    return mapToProfile(profile);
  } catch (error) {
    console.error("Instagram scraping failed:", error);
    return null;
  }
}

function mapToProfile(raw: Record<string, unknown>): InstagramProfile {
  const latestPosts = Array.isArray(raw.latestPosts) ? raw.latestPosts : [];

  return {
    username: String(raw.username || ""),
    fullName: String(raw.fullName || ""),
    bio: String(raw.biography || ""),
    followersCount: Number(raw.followersCount || 0),
    followingCount: Number(raw.followingCount || 0),
    postsCount: Number(raw.postsCount || 0),
    isVerified: Boolean(raw.verified),
    profilePicUrl: String(raw.profilePicUrl || ""),
    externalUrl: raw.externalUrl ? String(raw.externalUrl) : undefined,
    recentPosts: latestPosts.slice(0, 12).map(mapToPost),
  };
}

function mapToPost(raw: Record<string, unknown>): InstagramPost {
  return {
    id: String(raw.id || raw.shortCode || ""),
    caption: String(raw.caption || ""),
    likesCount: Number(raw.likesCount || 0),
    commentsCount: Number(raw.commentsCount || 0),
    timestamp: String(raw.timestamp || ""),
    imageUrl: String(raw.displayUrl || raw.url || ""),
    type: raw.type === "Video"
      ? "video"
      : raw.type === "Sidecar"
        ? "carousel"
        : "image",
  };
}
