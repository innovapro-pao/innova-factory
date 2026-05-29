// api/video.js
// Genera un video completo (multi-escena) usando HeyGen Video Agent
// Endpoint creacion: POST /v3/video-agents
// Endpoint polling:  GET  /v3/videos/{video_id}
//
// VERSION 3: TOLERANCIA ALTA a respuestas raras durante polling
// El video tarda 2-3 minutos. NO escapa a HeyGen. Espera tranquilo.

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
    return res.status(500).json({ error: 'HEYGEN_API_KEY no configurada en Vercel' });
  }

  async function safeJson(response) {
    const raw = await response.text();
    try {
      return { ok: true, data: JSON.parse(raw), raw };
    } catch (e) {
      return { ok: false, data: null, raw };
    }
  }

  try {
    const createResponse = await fetch('https://api.heygen.com/v3/video-agents', {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt }),
    });

    const createParsed = await safeJson(createResponse);

    if (!createResponse.ok) {
      console.error('Create no OK:', createResponse.status, createParsed.raw);
      return res.status(500).json({
        error: 'No se pudo iniciar la generacion del video',
      });
    }

    if (!createParsed.ok) {
      return res.status(500).json({
        error: 'Error al iniciar la generacion del video',
      });
    }

    const createData = createParsed.data;
    const videoId = createData.data?.video_id || createData.video_id;

    if (!videoId) {
      return res.status(500).json({
        error: 'No se pudo identificar el video',
      });
    }

    console.log('Video iniciado. video_id:', videoId);

    let videoUrl = null;
    let videoPageUrl = null;
    let thumbnailUrl = null;
    let duration = null;
    let intentos = 0;
    const maxIntentos = 30;

    let totalErroresVisto = 0;

    while (intentos < maxIntentos) {
      await new Promise((resolve) => setTimeout(resolve, 8000));
      intentos++;

      let statusResponse;
      try {
        statusResponse = await fetch(
          `https://api.heygen.com/v3/videos/${videoId}`,
          { headers: { 'X-Api-Key': HEYGEN_API_KEY } }
        );
      } catch (fetchErr) {
        totalErroresVisto++;
        console.log(`Intento ${intentos}: error de red`);
        continue;
      }

      const statusParsed = await safeJson(statusResponse);

      if (!statusParsed.ok) {
        totalErroresVisto++;
        console.log(`Intento ${intentos}: no-JSON (${totalErroresVisto} totales). Sigo esperando.`);
        continue;
      }

      const statusData = statusParsed.data;
      const status = statusData.data?.status || statusData.status;
      const url = statusData.data?.video_url || statusData.video_url;
      const pageUrl = statusData.data?.video_page_url || statusData.video_page_url;
      const thumb = statusData.data?.thumbnail_url || statusData.thumbnail_url;
      const dur = statusData.data?.duration || statusData.duration;

      console.log(`Intento ${intentos}: status="${status}", url=${url ? 'SI' : 'NO'}`);

      if (status === 'completed' || status === 'success' || url) {
        videoUrl = url;
        videoPageUrl = pageUrl;
        thumbnailUrl = thumb;
        duration = dur;
        if (videoUrl) break;
      }

      if (status === 'failed' || status === 'error') {
        return res.status(500).json({
          error: 'No se pudo generar el video. Probá de nuevo.',
        });
      }
    }

    if (!videoUrl) {
      console.log(`Timeout: ${intentos} intentos, ${totalErroresVisto} errores no-JSON`);
      return res.status(500).json({
        error: 'El video esta tardando mas de lo esperado. Volvelo a intentar.',
      });
    }

    return res.status(200).json({
      success: true,
      video_url: videoUrl,
      video_page_url: videoPageUrl,
      thumbnail_url: thumbnailUrl,
      duration: duration,
      video_id: videoId,
    });
  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({
      error: 'Error al generar el video. Probá de nuevo.',
    });
  }
}
