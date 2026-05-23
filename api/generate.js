export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { step, data } = req.body;
    const key = process.env.ANTHROPIC_API_KEY;

    const prompts = {
      ebook: `Eres experto en infoproductos. Crea un ebook completo en español para: Producto: ${data.product || ''}, Publico: ${data.audience || ''}, Problema: ${data.problem || ''}, Transformacion: ${data.transformation || ''}. Incluye: 3 titulos magneticos, indice con 7 capitulos, introduccion de 400 palabras, capitulo 1 completo de 600 palabras, capitulo 2 completo de 600 palabras, conclusion con llamada a la accion.`,
      bonos: `Eres experto en lanzamientos digitales. Crea 4 bonos irresistibles en español para: Producto: ${data.product || ''}, Publico: ${data.audience || ''}, Precio: ${data.price || ''}. Para cada bono incluye: nombre atractivo, descripcion detallada, valor percibido, por que lo incluyes, y copy para presentarlo.`,
      landing: `Eres experto en landing pages. Crea contenido completo en español para una landing page de: Producto: ${data.product || ''}, Publico: ${data.audience || ''}, Precio: ${data.price || ''}. Incluye: headline principal, subheadline, 5 puntos de dolor, presentacion de solucion, 6 beneficios, seccion de bonos, garantia, precio con urgencia y CTA poderoso.`,
      copies: `Eres copywriter experto en AIDA. Crea en español para: Producto: ${data.product || ''}, Publico: ${data.audience || ''}, Precio: ${data.price || ''}. Genera: 5 emails de lanzamiento completos, 5 posts de Instagram con caption y hashtags, 7 scripts de stories, 3 anuncios para Facebook Ads.`,
      creativos: `Eres director creativo. Crea briefs detallados en español para: Producto: ${data.product || ''}, Estetica: galaxy oscura, fucsia #ff006e, violeta #7c3aed. Genera: brief de portada de ebook, brief de banner 1080x1080, descripcion de 6 slides de carrusel, 5 prompts para Midjourney o DALL-E, paleta de marca completa.`,
      trafico: `Eres experto en trafico digital. Crea estrategia completa en español para: Producto: ${data.product || ''}, Publico: ${data.audience || ''}, Precio: ${data.price || ''}. Incluye: plan organico 30 dias, estrategia Facebook Ads con segmentacion, funnel de ventas, cronograma de lanzamiento semana a semana.`,
    };

    const prompt = prompts[step] || prompts.ebook;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const json = await r.json();
    const text = json?.content?.[0]?.text || 'Error al generar contenido';
    return res.status(200).json({ content: text, step });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
