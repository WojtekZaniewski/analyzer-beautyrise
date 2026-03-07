const MAX_CONTENT_LENGTH = 3000;

export async function scrapeWebsite(url: string): Promise<string> {
  try {
    console.log("[website] Fetching:", url);
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error("[website] Fetch failed:", response.status);
      return "";
    }

    const html = await response.text();
    const content = extractContent(html);
    console.log("[website] Done, content length:", content.length);
    return content;
  } catch (error) {
    console.error("[website] Scraping failed:", error);
    return "";
  }
}

function extractContent(html: string): string {
  const parts: string[] = [];

  // Meta title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) parts.push(`Tytul strony: ${decode(titleMatch[1].trim())}`);

  // Meta description
  const descMatch = html.match(
    /<meta\s+(?:name|property)=["'](?:description|og:description)["']\s+content=["']([^"']+)["']/i
  ) || html.match(
    /<meta\s+content=["']([^"']+)["']\s+(?:name|property)=["'](?:description|og:description)["']/i
  );
  if (descMatch) parts.push(`Opis: ${decode(descMatch[1].trim())}`);

  // Remove scripts, styles, nav, footer, header
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "");

  // Extract headings
  const headings: string[] = [];
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let match;
  while ((match = headingRegex.exec(cleaned)) !== null) {
    const text = stripTags(match[1]).trim();
    if (text && text.length > 2) headings.push(text);
  }
  if (headings.length > 0) {
    parts.push(`\nNaglowki:\n${headings.slice(0, 20).map((h) => `- ${h}`).join("\n")}`);
  }

  // Extract paragraphs
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  while ((match = pRegex.exec(cleaned)) !== null) {
    const text = stripTags(match[1]).trim();
    if (text && text.length > 20) paragraphs.push(text);
  }
  if (paragraphs.length > 0) {
    parts.push(`\nTresc:\n${paragraphs.slice(0, 30).join("\n")}`);
  }

  // Extract list items (often contain services/pricing)
  const listItems: string[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  while ((match = liRegex.exec(cleaned)) !== null) {
    const text = stripTags(match[1]).trim();
    if (text && text.length > 5 && text.length < 200) listItems.push(text);
  }
  if (listItems.length > 0) {
    parts.push(`\nElementy list (uslugi/cennik):\n${listItems.slice(0, 30).map((li) => `- ${li}`).join("\n")}`);
  }

  const result = parts.join("\n");
  return result.slice(0, MAX_CONTENT_LENGTH);
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decode(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
