// api/gpt-image.js — INNOVA FACTORY
// Endpoint para generar imágenes con GPT-Image-1 (OpenAI)
// Usa la misma OPENAI_API_KEY que ya está en Vercel.
//
// Recibe: { prompt, size, quality }
//   - prompt: descripción libre del usuario (estilo ChatGPT)
//   - size: "1024x1024" | "1024x1536" | "1536x1024" | "auto"
//   - quality: "low" | "medium" | "high" | "auto" (default: "high")
//
// Devuelve: { url: "data:image/png;base64,...", model: "gpt-image-1" }

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY no configurada en Vercel' });
    }

    const { prompt, size, quality } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Falta el prompt' });
    }

    // Validar y normalizar size
    const validSizes = ['1024x1024', '1024x1536', '1536x1024', 'auto'];
    const finalSize = validSizes.includes(size) ? size : '1024x1024';

    // Validar y normalizar quality (default: high para calidad pro)
    const validQualities = ['low', 'medium', 'high', 'auto'];
    const finalQuality = validQualities.includes(quality) ? quality : 'high';

    // Llamar a OpenAI Images API con gpt-image-1
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt.trim(),
        n: 1,
        size: finalSize,
        quality: finalQuality,
        output_format: 'png',
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('[gpt-image] OpenAI error:', openaiRes.status, errText);
      let errMsg = `OpenAI error ${openaiRes.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
      } catch (e) {}
      return res.status(500).json({ error: errMsg });
    }

    const data = await openaiRes.json();
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      return res.status(500).json({ error: 'Respuesta inesperada de OpenAI' });
    }

    // Devolver como data URL para que el navegador la muestre directo
    const dataUrl = `data:image/png;base64,${data.data[0].b64_json}`;

    return res.status(200).json({
      url: dataUrl,
      model: 'gpt-image-1',
      size: finalSize,
      quality: finalQuality,
    });
  } catch (err) {
    console.error('[gpt-image] Exception:', err);
    return res.status(500).json({ error: err.message || 'Error generando imagen' });
  }
}
