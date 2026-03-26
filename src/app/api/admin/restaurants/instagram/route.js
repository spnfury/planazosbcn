import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/**
 * Decode all HTML entities (named, decimal, hex) in a string.
 */
function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Extract a meta tag content by property name.
 * Handles both attribute orderings:
 *   <meta property="og:title" content="...">
 *   <meta content="..." property="og:title">
 */
function extractMetaContent(html, property) {
  // Pattern 1: property first, then content
  const p1 = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const m1 = html.match(p1);
  if (m1) return m1[1];

  // Pattern 2: content first, then property
  const p2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i');
  const m2 = html.match(p2);
  if (m2) return m2[1];

  return null;
}

/**
 * Download an image from a URL and re-upload it to Supabase Storage
 * so we have a permanent URL instead of Instagram's expiring CDN URLs.
 */
async function persistLogoToStorage(imageUrl) {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });

    if (!response.ok) {
      console.error("Failed to download Instagram logo:", response.status);
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());

    const extMap = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
    const ext = extMap[contentType] || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `logos/${filename}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("docs")
      .upload(filePath, buffer, {
        contentType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("Logo upload error:", uploadError);
      return null;
    }

    const { data } = supabaseAdmin.storage.from("docs").getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error("Error persisting logo:", err);
    return null;
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes("instagram.com")) {
      return NextResponse.json({ error: "URL de Instagram no válida" }, { status: 400 });
    }

    // CRITICAL: cache: 'no-store' prevents Next.js from caching the fetch
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Instagram devolvió un error HTTP ${response.status}. Revisa la URL.` },
        { status: 502 }
      );
    }

    const html = await response.text();
    console.log("[IG Import] HTML length:", html.length);

    // Use robust extraction that handles both attribute orderings
    const rawTitle = extractMetaContent(html, "og:title");
    const rawImage = extractMetaContent(html, "og:image");
    const rawDesc = extractMetaContent(html, "og:description");

    console.log("[IG Import] Extracted raw values:", {
      title: rawTitle ? rawTitle.substring(0, 80) : null,
      image: rawImage ? rawImage.substring(0, 80) : null,
      desc: rawDesc ? rawDesc.substring(0, 80) : null,
    });

    // Validate we actually got useful data
    if (!rawTitle && !rawImage) {
      // Log a snippet of the HTML for debugging
      console.error("[IG Import] No meta tags found. HTML snippet:", html.substring(0, 500));
      return NextResponse.json(
        { error: "No se pudieron extraer datos del perfil. Instagram puede haber bloqueado la petición o la URL no es un perfil válido." },
        { status: 404 }
      );
    }

    // Parse name from og:title
    // Instagram format: "Nombre (@handle) • Fotos y vídeos de Instagram"
    let name = "";
    if (rawTitle) {
      const decoded = decodeHtmlEntities(rawTitle);
      name = decoded.split("•")[0].trim();
    }

    // Parse and persist logo
    let logoUrl = "";
    if (rawImage) {
      const decodedUrl = decodeHtmlEntities(rawImage);
      const permanentUrl = await persistLogoToStorage(decodedUrl);
      logoUrl = permanentUrl || decodedUrl;
    }

    // Parse description
    let description = "";
    if (rawDesc) {
      const decoded = decodeHtmlEntities(rawDesc);
      const dashIndex = decoded.indexOf(" - ");
      description = dashIndex > 0 ? decoded.substring(0, dashIndex).trim() : decoded;
    }

    console.log("[IG Import] Final result:", { name, logoUrl: logoUrl.substring(0, 60), description });

    return NextResponse.json({
      success: true,
      name,
      logoUrl,
      description,
    });

  } catch (error) {
    console.error("Error al obtener datos de Instagram:", error);
    return NextResponse.json(
      { error: "No se pudieron importar los datos de Instagram. " + (error.message || "") },
      { status: 500 }
    );
  }
}
