import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes("instagram.com")) {
      return NextResponse.json({ error: "URL de Instagram no válida" }, { status: 400 });
    }

    // Usamos el User-Agent de Googlebot para evitar bloqueos por parte de Instagram
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept-Language": "es-ES,es;q=0.9",
      },
      next: { revalidate: 3600 } // Cache por 1 hora
    });

    if (!response.ok) {
      throw new Error(`Error HTTP de Instagram: ${response.status}`);
    }

    const html = await response.text();

    // Extraer datos usando expresiones regulares básicas sobre <meta> tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

    // Instagram "og:title" suele ser "Nombre de usuario (@handle) • Instagram..."
    let name = "";
    if (titleMatch && titleMatch[1]) {
      // Limpiar un poco el título extrayendo solo el nombre y usuario
      const rawTitle = titleMatch[1];
      name = rawTitle.split("•")[0].trim();
      
      // Opcional: decodificar entidades HTML si las hay, ej &#064; -> @
      name = name.replace(/&#064;/g, "@").replace(/&amp;/g, "&");
    }

    let logoUrl = "";
    if (imageMatch && imageMatch[1]) {
      logoUrl = imageMatch[1];
      logoUrl = logoUrl.replace(/&amp;/g, "&");
    }

    // Para los reels virales de momento dejamos espacio porque el HTML crudo
    // no siempre incluye los edges de video en la página de perfil público para robots.
    // Esto lo manejaremos en UI para introducirlos manualmente como URLs destacadas.

    return NextResponse.json({
      success: true,
      name: name,
      logoUrl: logoUrl,
    });

  } catch (error) {
    console.error("Error al obtener datos de Instagram:", error);
    return NextResponse.json({ error: "No se pudieron importar los datos de Instagram." }, { status: 500 });
  }
}
