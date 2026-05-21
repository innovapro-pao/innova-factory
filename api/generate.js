export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { step, data } = body;

    if (!step || !data) {
      return new Response(JSON.stringify({ error: "Missing step or data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompts = {
      ebook: `Eres un experto en marketing digital e infoproductos. Crea un EBOOK COMPLETO y profesional basado en estos datos del cliente:

Nombre del producto/servicio: ${data.product}
Público objetivo: ${data.audience}
Problema principal que resuelve: ${data.problem}
Transformación prometida: ${data.transformation}
Precio aproximado: ${data.price}

Genera el ebook completo con:
1. TÍTULO MAGNÉTICO (3 opciones con subtítulo)
2. ÍNDICE DETALLADO (mínimo 7 capítulos)
3. INTRODUCCIÓN PODEROSA (500 palabras)
4. CAPÍTULO 1 completo (800 palabras)
5. CAPÍTULO 2 completo (800 palabras)
6. CAPÍTULO 3 completo (800 palabras)
7. CONCLUSIÓN CON LLAMADA A LA ACCIÓN (400 palabras)
8. SOBRE LA AUTORA/AUTOR

Escribe en español, tono profesional pero cálido. Formato claro con títulos y subtítulos.`,

      bonos: `Eres un estratega de lanzamientos digitales. Basado en este infoproducto:

Producto: ${data.product}
Público: ${data.audience}
Transformación: ${data.transformation}
Precio: ${data.price}

Crea un PAQUETE DE BONOS IRRESISTIBLE con:
1. BONO 1: Nombre + descripción detallada + valor percibido + por qué lo incluyes
2. BONO 2: Nombre + descripción detallada + valor percibido + por qué lo incluyes  
3. BONO 3: Nombre + descripción detallada + valor percibido + por qué lo incluyes
4. BONO SORPRESA (para los primeros compradores): descripción + urgencia
5. TABLA DE VALOR TOTAL: precio real vs precio de oferta
6. COPY para presentar los bonos en la landing
7. EMAILS de entrega de bonos (1 por bono)

Todo en español, orientado a conversión máxima.`,

      landing: `Eres un experto en copywriting y diseño de landing pages de alta conversión. Genera el HTML COMPLETO de una landing page para:

Producto: ${data.product}
Público: ${data.audience}
Problema: ${data.problem}
Transformación: ${data.transformation}
Precio: ${data.price}
Bonos mencionados: ${data.bonos || "sí incluye bonos"}

La landing debe incluir en HTML/CSS/JS completo:
- Hero section con headline magnético y subheadline
- Sección "¿Te identificas con esto?" (pain points)
- Presentación de la solución
- Lo que vas a lograr (bullets de beneficios)
- Módulos/contenido del producto
- Bonos
- Testimonios (placeholder realista)
- Garantía
- Precio con tachado y urgencia
- CTA final poderoso
- FAQ

Usa colores: negro (#0a0a0f), fucsia (#ff006e), violeta (#7c3aed). Fuentes Google Fonts. CSS inline o en style tag. JavaScript para el countdown timer.
Código HTML completo listo para deployar.`,

      copies: `Eres un copywriter experto en fórmula AIDA y persuasión ética. Crea un PACK COMPLETO DE COPIES para:

Producto: ${data.product}
Público: ${data.audience}
Problema: ${data.problem}
Transformación: ${data.transformation}
Precio: ${data.price}

Genera:
1. EMAIL DE LANZAMIENTO (secuencia de 5 emails: anticipación, lanzamiento, urgencia, último día, post-venta)
2. COPIES PARA INSTAGRAM (5 posts con caption + hashtags + CTA)
3. STORIES SCRIPTS (7 stories guionadas)
4. WHATSAPP/TELEGRAM (3 mensajes para grupos o difusión)
5. ADS FACEBOOK/INSTAGRAM (3 anuncios con headline, texto, CTA)
6. BIO OPTIMIZADA para Instagram
7. POST DE LANZAMIENTO para LinkedIn

Todo en español, fórmula AIDA aplicada, emojis estratégicos donde corresponde.`,

      creativos: `Eres un director creativo especializado en marketing digital. Crea BRIEFS DETALLADOS DE CREATIVOS para:

Producto: ${data.product}
Público: ${data.audience}
Transformación: ${data.transformation}
Estética de marca: galaxy oscura, fucsia (#ff006e), violeta (#7c3aed), negro profundo

Genera briefs completos para:
1. PORTADA DEL EBOOK: descripción visual detallada, elementos, tipografía, colores
2. BANNER PRINCIPAL REDES: 1080x1080 y 1080x1920 - descripción elemento a elemento
3. POST CARRUSEL (6 slides): tema de cada slide, texto, visual sugerido
4. THUMBNAIL PARA VIDEO/REEL: composición, texto principal, colores
5. MOCKUP DEL PRODUCTO DIGITAL: cómo mostrarlo, perspectiva, dispositivos
6. PALETA DE MARCA COMPLETA: colores HEX, tipografías sugeridas, íconos estilo
7. PROMPTS PARA MIDJOURNEY/DALL-E: 5 prompts listos para generar imágenes del producto

Todo detallado para que un diseñador o IA pueda ejecutarlo sin dudas.`,

      trafico: `Eres un experto en tráfico digital y lanzamientos. Crea una ESTRATEGIA COMPLETA DE TRÁFICO para:

Producto: ${data.product}
Público: ${data.audience}
Precio: ${data.price}
Presupuesto para ads (si lo mencionaron): ${data.budget || "no especificado, dar opciones para todos los presupuestos"}

Genera:
1. ESTRATEGIA ORGÁNICA (0 inversión)
   - Plan de contenidos 30 días (calendario con temas)
   - SEO básico: palabras clave principales
   - Estrategia de colaboraciones/afiliados
   
2. ESTRATEGIA PAID (con inversión)
   - Facebook/Instagram Ads: estructura de campaña, segmentación detallada, presupuesto sugerido
   - Google Ads: palabras clave, tipo de campaña
   - Retargeting: secuencia recomendada
   
3. FUNNEL DE VENTAS COMPLETO
   - Tráfico frío → Lead magnet → Secuencia email → Oferta principal → Upsell
   - KPIs a medir en cada etapa
   - Métricas de éxito esperadas
   
4. CRONOGRAMA DE LANZAMIENTO (30 días)
   - Semana a semana: qué hacer, cuándo, cómo
   
5. HERRAMIENTAS RECOMENDADAS con alternativas gratuitas y pagas

Todo accionable, en español, con números y ejemplos concretos.`,
    };

    const prompt = prompts[step];
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Invalid step" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.json();
      return new Response(
        JSON.stringify({ error: "Anthropic API error", details: errorData }),
        {
          status: anthropicResponse.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const result = await anthropicResponse.json();
    const content = result.content[0]?.text || "";

    return new Response(JSON.stringify({ content, step }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
