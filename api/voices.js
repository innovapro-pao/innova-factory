// api/voices.js
// Lista las voces disponibles en español desde HeyGen API
// Se llama una vez al cargar el modal de avatar, NO consume creditos de video

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Solo se acepta GET' });
  }

  const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

  if (!HEYGEN_API_KEY) {
    return res.status(500).json({ error: 'HEYGEN_API_KEY no configurada' });
  }

  try {
    const response = await fetch('https://api.heygen.com/v2/voices', {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.data?.voices) {
      console.error('Error al traer voces:', data);
      return res.status(500).json({
        error: 'HeyGen no devolvio voces',
        detalle: data,
      });
    }

    // Filtrar solo voces en español
    const voicesSpanish = data.data.voices.filter((v) => {
      const lang = (v.language || '').toLowerCase();
      return lang.includes('spanish') || lang.includes('espa') || lang === 'es';
    });

    // Devolver formato simple para el frontend
    const simplified = voicesSpanish.map((v) => ({
      voice_id: v.voice_id,
      name: v.name,
      language: v.language,
      gender: v.gender,
      preview_audio_url: v.preview_audio_url,
    }));

    // Cache 1 hora para no llamar todo el tiempo
    res.setHeader('Cache-Control', 'public, max-age=3600');

    return res.status(200).json({
      success: true,
      count: simplified.length,
      voices: simplified,
    });
  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({
      error: 'Error al conectar con HeyGen',
      detalle: error.message,
    });
  }
}
