export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { prompt, type } = req.body;
    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(500).json({ error: 'OpenAI API key not configured' });
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const prompts = {
      mockup: `Professional 3D digital product mockup for: ${prompt}. Clean dark background, gold and white accents, premium quality hardcover book or ebook displayed at an angle, photorealistic rendering, soft studio lighting, no text overlays, marketing product shot style.`,
      logros: `Abstract dark luxury background image representing transformation and success. Black background, soft gold and pink bokeh lights, upward arrows and stars made of light, premium elegant atmosphere, no text, no people, cinematic lighting.`,
      bonos: `Dark premium flat lay of multiple digital books and guides stacked together. Black background, gold metallic accents, soft dramatic lighting on book covers, luxury product photography style, no text overlays, rich shadows and highlights.`,
      hero: `Dark moody premium lifestyle photography. Black background, gold bokeh lights, elegant dark surface, cinematic atmosphere. No text, no people, no books, no writing anywhere.`,
      custom: `${prompt}`,
    };
    const finalPrompt = prompts[type] || prompts.custom;
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: finalPrompt,
        n: 1,
        size: '1024x1024',
      }),
    });
    const json = await r.json();
    if (json.error) {
      return res.status(500).json({ error: json.error.message });
    }
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: 'No image generated' });
    const imageUrl = `data:image/png;base64,${b64}`;
    return res.status(200).json({ url: imageUrl, prompt: finalPrompt });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
