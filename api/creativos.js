export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, size } = req.body;
    const key = process.env.FAL_API_KEY;
    if (!key) return res.status(500).json({ error: 'FAL API key not configured' });
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    // Mapeo de tamaños de anuncio -> formato que entiende Flux
    const sizeMap = {
      '1080x1920': 'portrait_16_9',   // Stories 9:16 (vertical)
      '1080x1080': 'square_hd',       // Post cuadrado
      '1200x628':  'landscape_16_9',  // Banner horizontal
    };
    const imageSize = sizeMap[size] || 'square_hd';

    // El fondo NUNCA debe tener texto: el texto lo pone la app en HTML encima
    const finalPrompt = `${prompt}. Professional advertising background photography, premium quality, cinematic lighting, beautiful composition, NO text, NO words, NO letters, NO typography anywhere in the image.`;

    const r = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${key}`,
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        image_size: imageSize,
        num_images: 1,
        safety_tolerance: '2',
      }),
    });

    const json = await r.json();
    if (json.error) return res.status(500).json({ error: json.error });

    const imageUrl = json.images?.[0]?.url;
    if (!imageUrl) return res.status(500).json({ error: 'No image generated' });

    return res.status(200).json({ url: imageUrl, size });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
