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
      mockup: `Professional digital product mockup for: ${prompt}. Clean dark background with gold accents, 3D book or course mockup, premium quality, photorealistic, marketing image style. No text overlays.`,
      logros: `Motivational infographic image showing transformation and success for: ${prompt}. Dark elegant background, gold and pink accent colors, icons showing achievement and growth, modern design style. No text.`,
      bonos: `Premium bonus pack digital products image for: ${prompt}. Dark luxury background, multiple digital books and guides stacked, golden glowing effects, premium marketing style. No text.`,
      hero: `Stunning hero banner background for: ${prompt}. Dark galaxy aesthetic, purple and pink gradient bokeh lights, premium digital marketing visual, abstract elegant background. No people, no text.`,
      custom: prompt,
    };

    const finalPrompt = prompts[type] || prompts.custom;

    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'dall-e-2',
        prompt: finalPrompt,
        n: 1,
        size: '1024x1024',
        
      }),
    });

    const json = await r.json();

    if (json.error) {
      return res.status(500).json({ error: json.error.message });
    }

    const imageUrl = json.data?.[0]?.url;
    if (!imageUrl) return res.status(500).json({ error: 'No image generated' });

    return res.status(200).json({ url: imageUrl, prompt: finalPrompt });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
