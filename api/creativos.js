export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, size } = req.body;
    const key = process.env.OPENAI_API_KEY;

    // Tamaños DALL-E 3 soportados
    const sizeMap = {
      '1080x1920': '1024x1792',  // Stories 9:16
      '1080x1080': '1024x1024',  // Post cuadrado
      '1200x628':  '1792x1024',  // Banner horizontal
    };

    const dalleSize = sizeMap[size] || '1024x1024';

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: dalleSize,
        quality: 'standard',
      }),
    });

    const json = await response.json();
    if (json.error) throw new Error(json.error.message);

    const url = json.data?.[0]?.url;
    if (!url) throw new Error('No se recibió imagen');

    return res.status(200).json({ url, size });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
