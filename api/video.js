// api/video.js
// VERSION 4 — ASINCRONICO
// Solo INICIA el video en HeyGen y devuelve el video_id al instante.
// El frontend hace polling usando /api/video-check.js
// Asi NUNCA hay timeout de Vercel.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo se acepta POST' });
  }

  const { prompt } = req.body;

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Falta el prompt del video' });
  }

  const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

  if (!HEYGEN_API_KEY) {
    return res.status(500).json({ error: 'API_KEY no configurada en Vercel' });
  }

  try {
    // Crear video con Video Agent — UNA sola llamada, sin polling
    const createResponse = await fetch('https://api.heygen.com/v3/video-agents', {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt }),
    });

    const raw = await createResponse.text();
    let createData;
    try {
      createData = JSON.parse(raw);
    } catch (e) {
      console.error('Respuesta no-JSON al crear:', raw);
      return res.status(500).json({ error: 'Error al iniciar la generacion del video' });
    }

    if (!createResponse.ok) {
      console.error('Create no OK:', createResponse.status, raw);
      return res.status(500).json({
        error: 'No se pudo iniciar la generacion del video',
      });
    }

    const videoId = createData.data?.video_id || createData.video_id;

    if (!videoId) {
      return res.status(500).json({ error: 'No se pudo identificar el video' });
    }

    console.log('Video iniciado. video_id:', videoId);

    // Devolver INMEDIATAMENTE el video_id. El frontend hara polling.
    return res.status(200).json({
      success: true,
      video_id: videoId,
      mensaje: 'Video iniciado, ahora se procesa en segundo plano',
    });
  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({
      error: 'Error al iniciar el video. Probá de nuevo.',
    });
  }
}
