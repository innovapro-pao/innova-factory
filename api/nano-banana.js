// api/nano-banana.js — INNOVA FACTORY v4.0
// Endpoint dual:
//   MODO "improve": mejora un prompt simple usando GPT-4o → devuelve prompt PRO
//   MODO "generate" (default): genera imagen con Nano Banana Pro (Gemini 3 Pro Image) → devuelve URL base64
//
// "improve" usa OPENAI_API_KEY (GPT-4o, cerebro de ChatGPT para mejorar prompts)
// "generate" usa GEMINI_API_KEY (Nano Banana Pro = gemini-3-pro-image, calidad pro 2K/4K)
//
// Body params:
//   { mode: "improve", prompt: "simple text" }                          → { improved_prompt: "..." }
//   { mode: "generate", prompt: "...", size, quality, aspectRatio }     → { url, model, size, quality }
//   { prompt, size, quality }                                           → modo generate (backward compat)

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

      // System prompt optimizado para Nano Banana Pro (Gemini 3 Pro Image).
      // Gemini funciona MEJOR con prompts narrativos descriptivos que con listas de keywords.
      const systemPrompt = `You are an expert prompt engineer for Google's Nano Banana Pro (gemini-3-pro-image) image generation model.

YOUR JOB: take a simple user prompt (in any language, usually Spanish) and transform it into a professional, detailed English image-generation prompt that Nano Banana Pro will interpret to produce magazine-quality, ChatGPT-level results.

CRITICAL RULES FOR NANO BANANA PRO:
1. Output ONLY the enhanced prompt in ENGLISH. No preamble, no quotes, no explanations.
2. Length: 200-400 words.
3. NANO BANANA PRO LOVES NARRATIVE DESCRIPTIONS — write descriptive paragraphs, NOT keyword lists. "Describe the scene, don't just list keywords."
4. Be CONCRETE and VISUAL. Describe what should be SEEN, not abstract concepts.
5. If user mentions specific TEXT (titles, prices, dates, names), include them LITERALLY in double quotes. Specify Spanish if the source was Spanish. Nano Banana Pro renders text BETTER than gpt-image-1.
6. NEVER invent texts that the user did not mention.
7. Infer reasonable visual details (colors, composition, style) that match the user's intent.
8. Structure with clear visual sections written as flowing prose.
9. **MANDATORY PHOTOREALISM RULE — NON-NEGOTIABLE**: ALL elements in the image MUST be rendered as photorealistic professional studio photography. EVERY single object — including products, kitchen tools, machines, jars, accessories, props, decorative elements, gadgets — MUST look like a REAL photograph taken with a professional 85mm lens. ABSOLUTELY FORBIDDEN: 3D cartoon renders, illustrated icons, vector graphics, flat design, stylized drawings, anime style, infographic style, clipart, low-poly 3D, isometric illustrations. If the user mentions any object (e.g. pasta machine, grinder, jar), describe it AS A REAL PHYSICAL PHOTOGRAPHED OBJECT with realistic materials, shadows, reflections, textures. ALWAYS end the prompt with this exact line: "All elements rendered as photorealistic commercial product photography, NO illustrations, NO 3D cartoon renders, NO stylized graphics, real materials with realistic shadows, reflections, and textures, shot on professional camera with 85mm lens, premium magazine quality."

STRUCTURE TO FOLLOW (as narrative prose):
- Opening line: image type + format (vertical/horizontal/square) + overall style
- COMPOSITION: explicit layout (left/right/center, foreground/background)
- KEY ELEMENTS: detailed description of main subjects (people, products, objects)
- TEXT ON IMAGE (if any): exact text in quotes + typography style + color + effects
- BACKGROUND: described with specific colors and atmosphere
- LIGHTING: type, direction, mood
- STYLE: reference professional aesthetics (editorial flat-lay, cinematic poster, Apple keynote, premium magazine cover, Etsy bestseller mockup, etc.)
- COLOR PALETTE: specific color names or hex codes
- TECHNICAL: camera lens (85mm, 50mm), depth of field, sharpness, quality (photorealistic, 8K)

TONE: write like a luxury commercial photographer briefing a designer. Use terms like:
- "soft diffused lighting", "warm natural morning light", "shallow depth of field", "soft bokeh"
- "premium hardcover", "matte finish", "metallic gold accents", "realistic textures"
- "feminine aesthetic", "luxury ecommerce", "editorial product photography"
- "centered composition", "rule of thirds", "negative space"

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
            { role: 'user', content: `Enhance this prompt for Nano Banana Pro image generation. Make it produce a ChatGPT-quality professional result:\n\n${prompt.trim()}` }
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
    // MODO "GENERATE" (default) — genera imagen con Nano Banana Pro (Gemini 3 Pro Image)
    // ============================================================
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel' });
    }

    const { size, quality, aspectRatio } = req.body || {};

    // Mapeo de tamaños del frontend viejo (gpt-image-1) a los de Nano Banana Pro
    // gpt-image-1 usaba: 1024x1024, 1024x1536, 1536x1024
    // Nano Banana Pro usa: aspectRatio + imageSize
    let finalAspectRatio = '1:1';
    if (aspectRatio) {
      // Si el frontend ya manda aspectRatio directamente, lo usamos
      const validRatios = ['1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9'];
      finalAspectRatio = validRatios.includes(aspectRatio) ? aspectRatio : '1:1';
    } else if (size) {
      // Backward compat: traducir tamaños viejos a aspect ratios
      if (size === '1024x1024') finalAspectRatio = '1:1';
      else if (size === '1024x1536') finalAspectRatio = '2:3';      // vertical
      else if (size === '1536x1024') finalAspectRatio = '3:2';      // horizontal
    }

    // Mapeo de quality del frontend viejo a imageSize de Nano Banana Pro
    // gpt-image-1 usaba: low, medium, high, auto
    // Nano Banana Pro usa: 1K, 2K, 4K
    let finalImageSize = '2K'; // default = calidad pro
    if (quality === 'low') finalImageSize = '1K';
    else if (quality === 'medium') finalImageSize = '1K';
    else if (quality === 'high') finalImageSize = '2K';
    else if (quality === 'auto') finalImageSize = '2K';
    else if (['1K', '2K', '4K'].includes(quality)) finalImageSize = quality;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `IMPORTANT RENDERING RULE: All visual elements in this image must be rendered as photorealistic professional commercial photography. ABSOLUTELY NO illustrations, NO cartoon 3D renders, NO vector graphics, NO flat design icons, NO stylized drawings. Every object including products, tools, accessories, props must look like real physical objects photographed with an 85mm lens in a professional studio, with realistic materials, shadows, reflections and textures.\n\n${prompt.trim()}\n\nFINAL REMINDER: Render everything as a single cohesive photorealistic photograph, magazine quality. No mixed styles. No illustration elements.` }
            ]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              aspectRatio: finalAspectRatio,
              imageSize: finalImageSize,
            }
          }
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[nano-banana] Gemini error:', geminiRes.status, errText);
      let errMsg = `Gemini error ${geminiRes.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
      } catch (e) {}
      return res.status(500).json({ error: errMsg });
    }

    const data = await geminiRes.json();

    // Buscar la parte que contiene la imagen (ignorando los "thoughts")
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      return res.status(500).json({ error: 'Respuesta inesperada de Nano Banana Pro' });
    }

    let imageBase64 = null;
    for (const part of data.candidates[0].content.parts) {
      // Skip thoughts (imágenes intermedias del thinking mode)
      if (part.thought) continue;
      if (part.inlineData && part.inlineData.data) {
        imageBase64 = part.inlineData.data;
        break;
      }
      if (part.inline_data && part.inline_data.data) {
        imageBase64 = part.inline_data.data;
        break;
      }
    }

    if (!imageBase64) {
      // Si no encontramos imagen sin thought, agarramos la última con thought (es la final)
      const parts = data.candidates[0].content.parts;
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (part.inlineData && part.inlineData.data) {
          imageBase64 = part.inlineData.data;
          break;
        }
        if (part.inline_data && part.inline_data.data) {
          imageBase64 = part.inline_data.data;
          break;
        }
      }
    }

    if (!imageBase64) {
      return res.status(500).json({ error: 'Nano Banana Pro no devolvió imagen' });
    }

    const dataUrl = `data:image/png;base64,${imageBase64}`;
    return res.status(200).json({
      url: dataUrl,
      model: 'nano-banana-pro',
      size: finalImageSize,
      quality: finalImageSize,
      aspectRatio: finalAspectRatio,
    });
  } catch (err) {
    console.error('[nano-banana] Exception:', err);
    return res.status(500).json({ error: err.message || 'Error procesando solicitud' });
  }
}
