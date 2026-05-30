// api/gpt-image.js — INNOVA FACTORY v2.0
// Endpoint dual:
//   MODO "improve": mejora un prompt simple usando Claude → devuelve prompt PRO
//   MODO "generate" (default): genera imagen con GPT-Image-1 → devuelve URL
//
// Body params:
//   { mode: "improve", prompt: "simple text" }              → { improved_prompt: "..." }
//   { mode: "generate", prompt: "...", size, quality }      → { url, model, size, quality }
//   { prompt, size, quality }                               → modo generate (backward compat)

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { mode, prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Falta el prompt' });
    }

    // ============================================================
    // MODO "IMPROVE" — mejora el prompt con Claude
    // ============================================================
    if (mode === 'improve') {
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (!anthropicKey) {
        return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada' });
      }

      const systemPrompt = `Sos un experto en prompt engineering para generación de imágenes con IA (modelo gpt-image-1 de OpenAI).

Tu tarea: tomar un prompt simple de usuario (en español o cualquier idioma) y convertirlo en un prompt PROFESIONAL en INGLÉS, detallado, estructurado, listo para producir banners publicitarios o imágenes premium nivel ChatGPT/agencia.

ESTRUCTURA OBLIGATORIA del prompt mejorado:
1. Frase inicial con tipo de imagen, formato (vertical/horizontal/cuadrado), aspect ratio y estilo general
2. COMPOSITION: layout, distribución de elementos
3. Si hay TEXTO en el banner: indicar el texto EXACTO (literal entre comillas) + tipografía + colores + efectos (3D, neón, gradient, glow)
4. ELEMENTOS visuales detallados (personas, productos, decoraciones)
5. BACKGROUND: descripción del fondo con colores específicos (#hex si aplica)
6. STYLE: referencia a estilos profesionales (Apple keynote, magazine cover, etc.)
7. TECHNICAL: calidad (8K, sharp focus, etc.)

REGLAS:
- Siempre en INGLÉS (gpt-image-1 funciona mejor en inglés)
- Mínimo 200 palabras, máximo 400
- Estructurado con líneas en MAYÚSCULAS como secciones (COMPOSITION:, MAIN HEADLINE:, BACKGROUND:, etc.)
- Si el usuario menciona textos específicos (títulos, fechas, precios), incluirlos LITERALMENTE entre comillas dobles
- Usar terminología técnica de diseño: "extruded 3D typography", "neon glow", "volumetric lighting", "cinematic", "depth of field", "rim light", "magazine cover quality"
- Para banners promocionales: aspecto urgente y aspiracional
- Para fotos de producto: profesional, editorial
- NUNCA inventes textos que el usuario no mencionó
- NO incluyas explicaciones, devolvé SOLO el prompt mejorado

Tu respuesta debe ser ÚNICAMENTE el prompt mejorado, sin preámbulo, sin comillas externas, sin explicación.`;

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          system: systemPrompt,
          messages: [
            { role: 'user', content: `Mejorá este prompt para generar una imagen profesional:\n\n${prompt.trim()}` }
          ],
        }),
      });

      if (!claudeRes.ok) {
        const errText = await claudeRes.text();
        console.error('[improve-prompt] Claude error:', claudeRes.status, errText);
        let errMsg = `Claude error ${claudeRes.status}`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
        } catch (e) {}
        return res.status(500).json({ error: errMsg });
      }

      const claudeData = await claudeRes.json();
      if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
        return res.status(500).json({ error: 'Respuesta inesperada de Claude' });
      }

      const improvedPrompt = claudeData.content[0].text.trim();
      return res.status(200).json({
        improved_prompt: improvedPrompt,
        original_prompt: prompt.trim(),
      });
    }

    // ============================================================
    // MODO "GENERATE" (default) — genera imagen con GPT-Image-1
    // ============================================================
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY no configurada en Vercel' });
    }

    const { size, quality } = req.body || {};

    const validSizes = ['1024x1024', '1024x1536', '1536x1024', 'auto'];
    const finalSize = validSizes.includes(size) ? size : '1024x1024';

    const validQualities = ['low', 'medium', 'high', 'auto'];
    const finalQuality = validQualities.includes(quality) ? quality : 'high';

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

    const dataUrl = `data:image/png;base64,${data.data[0].b64_json}`;
    return res.status(200).json({
      url: dataUrl,
      model: 'gpt-image-1',
      size: finalSize,
      quality: finalQuality,
    });
  } catch (err) {
    console.error('[gpt-image] Exception:', err);
    return res.status(500).json({ error: err.message || 'Error procesando solicitud' });
  }
}
