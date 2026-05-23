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
      bonos: `Eres experto en lanzamientos digitales. Crea 4 bonos irresistibles en español para: Producto: ${data.product || ''}, Publico: ${data.audience || ''}, Precio: ${data.price || ''}. Para cada bono incluye: nombre atractivo, descripcion detallada, valor percibido, por que lo incluyes, y copy para presentarlo en la landing.`,
      landing: `Genera SOLO codigo HTML puro sin explicaciones. Crea una landing page completa con HTML CSS y JavaScript en un solo archivo para: Producto: ${data.product || ''}, Publico: ${data.audience || ''}, Precio: ${data.price || ''}. Secciones: hero con headline magnetico, seccion de dolor, presentacion de solucion, beneficios en bullets, bonos, garantia, precio con urgencia y countdown, CTA final, FAQ. Colores: fondo negro #05050a, fucsia #ff006e, violeta #7c3aed. Google Fonts Syne. SOLO devuelve el codigo HTML comenzando con <!DOCTYPE html>.`,
      copies: `Eres copywriter experto en AIDA. Crea en español para: Producto: ${data.product || ''}, Publico: ${data.audience || ''}, Precio: ${data.price || ''}. Genera: 5 emails de lanzamiento completos, 5 posts de Instagram con caption y hashtags, 7 scripts de stories, 3 anuncios para Facebook Ads con headline texto y CTA.`,
      creativos: `Eres director creativo. Crea briefs detallados en español para: Producto: ${data.product || ''}, Estética: galaxy oscura, fucsia #ff006e, violeta #7c3aed. Genera: brief de portada de ebook, brief de banner 1080x1080, descripcion de 6 slides de carrusel, 5 prompts listos para Midjourney o DALL-E para generar imagenes del producto, paleta de marca completa con colores HEX y tipografias.`,
      trafico: `Eres experto en trafico digital. Crea estrategia completa en español para: Producto: ${data.product || ''}, Publico: ${data.audience || ''}, Precio: ${data.price || ''}. Incluye: plan organico 30 dias con calendario de contenidos, estrategia de Facebook Ads con segmentacion y presupuesto sugerido, funnel completo de ventas, cronograma de lanzamiento semana a semana, KPIs a medir.`,
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
    const text = json?.content?.[0]?.text || JSON.stringify(json);
    return res.status(200).json({ content: text, step });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
