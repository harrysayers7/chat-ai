import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 },
    );
  }

  try {
    // Basic metadata extraction
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ChatAI-LinkPreview/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Extract metadata using regex (basic implementation)
    const title =
      extractMetaTag(html, "title") ||
      extractMetaTag(html, "og:title") ||
      extractMetaTag(html, "twitter:title");
    const description =
      extractMetaTag(html, "description") ||
      extractMetaTag(html, "og:description") ||
      extractMetaTag(html, "twitter:description");
    const image =
      extractMetaTag(html, "og:image") || extractMetaTag(html, "twitter:image");

    // Extract favicon
    const favicon = extractFavicon(html, url);

    // Extract domain
    const domain = new URL(url).hostname.replace("www.", "");

    return NextResponse.json({
      title: title || domain,
      description: description || `Link to ${domain}`,
      image,
      favicon,
      url,
      domain,
    });
  } catch (error) {
    console.error("Error fetching link metadata:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch metadata",
        fallback: {
          title: new URL(url).hostname,
          description: `Link to ${new URL(url).hostname}`,
          url,
          domain: new URL(url).hostname.replace("www.", ""),
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`,
        },
      },
      { status: 500 },
    );
  }
}

function extractMetaTag(html: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractFavicon(html: string, baseUrl: string): string | null {
  // Look for favicon in various formats
  const faviconRegex =
    /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["']/i;
  const match = html.match(faviconRegex);

  if (match) {
    const href = match[1];
    if (href.startsWith("http")) {
      return href;
    } else if (href.startsWith("/")) {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${href}`;
    } else {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}/${href}`;
    }
  }

  return null;
}
