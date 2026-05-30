// api/gpt-image.js — INNOVA FACTORY v3.0
// Endpoint dual:
//   MODO "improve": mejora un prompt simple usando GPT-4o → devuelve prompt PRO
//   MODO "generate" (default): genera imagen con GPT-Image-1 → devuelve URL
//
// Ambos modos usan OPENAI_API_KEY (mismo proveedor = mejor sinergia con gpt-image-1)
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
    // MODO "IMPROVE" — mejora el prompt con GPT-4o (mismo cerebro que ChatGPT)
    // ============================================================
    if (mode === 'improve') {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return res.status(500).json({ error: 'OPENAI_API_KEY no configurada' });
      }

      // System prompt INSPIRADO en el que ChatGPT usa internamente para hablarle a GPT-Image-1.
      // GPT-4o es el modelo nativo de OpenAI entrenado para generar prompts óptimos para gpt-image-1.
      const systemPrompt = `You are an expert prompt engineer for OpenAI's gpt-image-1 image generation model. You work the same way ChatGPT does internally when a user asks it to create an image.

YOUR JOB: take a simple user prompt (in any language, usually Spanish) and transform it into a professional, detailed English image-generation prompt that gpt-image-1 will interpret to produce magazine-quality, ChatGPT-level results.

CRITICAL RULES:
1. Output ONLY the enhanced prompt in ENGLISH. No preamble, no quotes, no explanations.
2. Length: 200-400 words.
3. Be CONCRETE and VISUAL. Describe what should be SEEN, not abstract concepts.
4. If user mentions specific TEXT (titles, prices, dates, names), include them LITERALLY in double quotes. Specify Spanish if the source was Spanish.
5. NEVER invent texts that the user did not mention.
6. Infer reasonable visual details (colors, composition, style) that match the user's intent.
7. Structure with clear visual sections.

STRUCTURE TO FOLLOW:
- Opening line: image type + format (vertical/horizontal/square) + overall style
- COMPOSITION: explicit layout (left/right/center, foreground/background)
- KEY ELEMENTS: detailed description of main subjects (people, products, objects)
- TEXT ON IMAGE (if any): exact text in quotes + typography style + color + effects
- BACKGROUND: described with specific colors and atmosphere
- LIGHTING: type, direction, mood
- STYLE: reference professional aesthetics (editorial flat-lay, cinematic poster, Apple keynote, premium magazine cover, Etsy bestseller mockup, etc.)
- COLOR PALETTE: specific color names or hex codes
- TECHNICAL: camera lens (85mm, 50mm), depth of field, sharpness, quality (8K, photorealistic)

TONE: write like a luxury commercial photographer briefing a designer. Use terms like:
- "soft diffused lighting", "warm natural morning light", "shallow depth of field", "soft bokeh"
- "premium hardcover", "matte finish", "metallic gold accents", "realistic textures"
- "feminine aesthetic", "luxury ecommerce", "editorial product photography"
- "centered composition", "rule of thirds", "negative space"

EXAMPLE OUTPUT FORMAT:
"Luxury [type] for [purpose]. [Format and style]. COMPOSITION: [layout]. KEY ELEMENTS: [details]. TEXT: 'EXACT TEXT' in [style]. BACKGROUND: [description with colors]. LIGHTING: [type]. STYLE: [references]. COLOR PALETTE: [colors]. TECHNICAL: [camera, quality]."

Always think: "What would a top-tier creative director write to get THIS exact image?" That's your output.`;

      const openaiPromptRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Enhance this prompt for gpt-image-1 image generation. Make it produce a ChatGPT-quality professional result:\n\n${prompt.trim()}` }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      if (!openaiPromptRes.ok) {
        const errText = await openaiPromptRes.text();
        console.error('[improve-prompt] OpenAI error:', openaiPromptRes.status, errText);
        let errMsg = `OpenAI error ${openaiPromptRes.status}`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
        } catch (e) {}
        return res.status(500).json({ error: errMsg });
      }

      const openaiPromptData = await openaiPromptRes.json();
      if (!openaiPromptData.choices || !openaiPromptData.choices[0] || !openaiPromptData.choices[0].message || !openaiPromptData.choices[0].message.content) {
        return res.status(500).json({ error: 'Respuesta inesperada de GPT-4o' });
      }

      const improvedPrompt = openaiPromptData.choices[0].message.content.trim();
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
