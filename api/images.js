export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, type } = req.body;
    const key = process.env.FAL_API_KEY;
    if (!key) return res.status(500).json({ error: 'FAL API key not configured' });
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const prompts = {
      mockup: `Premium 3D digital ebook mockup, hardcover book displayed at elegant angle, dark background with gold accents, soft studio lighting, photorealistic, luxury product photography, no text overlays. Book about: ${prompt}`,
      logros: `Abstract dark luxury background, black background, soft gold and pink bokeh lights, upward arrows made of light, premium elegant atmosphere, no text, no people, cinematic lighting`,
      bonos: `Dark premium flat lay of multiple digital books stacked together, black background, gold metallic accents, dramatic lighting, luxury product photography, no text overlays`,
      hero: `Dark moody premium lifestyle photography, black background, gold bokeh lights, elegant dark surface, cinematic atmosphere, no text, no people, no books`,
      custom: `${prompt}`,
    };

    const finalPrompt = prompts[type] || prompts.custom;

    const r = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${key}`,
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        image_size: 'square_hd',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    const json = await r.json();

    if (json.error) return res.status(500).json({ error: json.error });

    const imageUrl = json.images?.[0]?.url;
    if (!imageUrl) return res.status(500).json({ error: 'No image generated' });

    return res.status(200).json({ url: imageUrl });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
