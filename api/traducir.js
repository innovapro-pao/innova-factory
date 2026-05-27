export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { texto, idioma_origen, idioma_destino } = req.body;
    if (!texto || !idioma_destino) {
      return res.status(400).json({ error: 'Falta texto o idioma destino' });
    }
    const key = process.env.ANTHROPIC_API_KEY;
    const idiomas = {
      es: 'español neutro',
      en: 'inglés (English)',
      pt: 'portugués (Português brasileño)',
      it: 'italiano (Italiano)',
      fr: 'francés (Français)',
    };
    const destinoNombre = idiomas[idioma_destino] || idioma_destino;
    const origenNombre = idiomas[idioma_origen] || 'detectalo automáticamente';

    const prompt = `Eres traductor profesional especializado en infoproductos digitales (ebooks, guías, bonos, landing pages).

TAREA: Traducí el siguiente texto al ${destinoNombre}.
Idioma origen: ${origenNombre}.

REGLAS CRÍTICAS:
1. Mantené EXACTAMENTE la estructura del texto: encabezados (#, ##, ###), listas con guiones, negritas con **, cursivas, saltos de línea, todo igual.
2. Si el texto tiene etiquetas HTML (<h1>, <p>, <div>, <style>, etc), NO las traduzcas — solo traducí el TEXTO VISIBLE entre etiquetas. Las etiquetas, atributos, IDs, clases CSS, URLs y código quedan IGUAL.
3. No traduzcas nombres propios, marcas registradas, ni precios (USD 97 queda USD 97).
4. Adaptá las expresiones idiomáticas al ${destinoNombre} para que suenen naturales, no traducción literal robótica.
5. Mantené el tono comercial / motivacional / vendedor del original.
6. Si encontrás emojis, dejalos tal cual.
7. NO agregues notas del traductor, NO expliques nada, NO uses comillas alrededor de tu respuesta.
8. Devolvé ÚNICAMENTE el texto traducido, sin preámbulo.

TEXTO A TRADUCIR:
${texto}`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const json = await r.json();
    if (json.error) {
      return res.status(500).json({ error: json.error.message || 'Error en la API' });
    }
    const text = json?.content?.[0]?.text || '';
    return res.status(200).json({ texto_traducido: text, idioma_destino });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
