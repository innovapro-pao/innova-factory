// api/avatars.js
// Lista los avatares disponibles desde HeyGen API
// Se llama al cargar el modal de avatar, NO consume créditos de video

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Solo se acepta GET' });
  }

  const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

  if (!HEYGEN_API_KEY) {
    return res.status(500).json({ error: 'HEYGEN_API_KEY no configurada' });
  }

  try {
    const response = await fetch('https://api.heygen.com/v2/avatars', {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.data) {
      console.error('Error al traer avatares:', data);
      return res.status(500).json({
        error: 'HeyGen no devolvio avatares',
        detalle: data,
      });
    }

    // HeyGen separa entre avatars (pre-built) y talking_photos (foto-a-avatar)
    const avatars = data.data.avatars || [];
    const talkingPhotos = data.data.talking_photos || [];

    // Devolver formato simple
    const simplified = avatars.map((a) => ({
      avatar_id: a.avatar_id,
      name: a.avatar_name,
      gender: a.gender,
      preview_image_url: a.preview_image_url,
      preview_video_url: a.preview_video_url,
    }));

    // Cache 1 hora
    res.setHeader('Cache-Control', 'public, max-age=3600');

    return res.status(200).json({
      success: true,
      count: simplified.length,
      avatars: simplified,
      talking_photos_count: talkingPhotos.length,
    });
  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({
      error: 'Error al conectar con HeyGen',
      detalle: error.message,
    });
  }
}
