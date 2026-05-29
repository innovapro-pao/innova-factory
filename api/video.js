// api/video.js
// Genera un video completo (multi-escena) usando HeyGen Video Agent
// Endpoint creacion: POST /v3/video-agents
// Endpoint polling:  GET  /v3/videos/{video_id}
//
// VERSION ROBUSTA: maneja respuestas no-JSON de HeyGen durante polling
// y devuelve link a HeyGen si tarda mas de 4 minutos (en vez de fallar)

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

  // Helper: parsea respuesta de forma segura, devuelve {ok, data, raw}
  async function safeJson(response) {
    const raw = await response.text();
    try {
      return { ok: true, data: JSON.parse(raw), raw };
    } catch (e) {
      return { ok: false, data: null, raw };
    }
  }

  try {
    // ============================================================
    // PASO 1: Crear video con Video Agent
    // ============================================================
    const createResponse = await fetch('https://api.heygen.com/v3/video-agents', {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
      }),
    });

    const createParsed = await safeJson(createResponse);

    if (!createResponse.ok) {
      console.error('HeyGen createResponse no OK:', createResponse.status, createParsed.raw);
      return res.status(500).json({
        error: 'HeyGen rechazo el pedido inicial',
        status_code: createResponse.status,
        respuesta_heygen: createParsed.raw.substring(0, 500),
      });
    }

    if (!createParsed.ok) {
      console.error('Respuesta de creacion no es JSON:', createParsed.raw);
      return res.status(500).json({
        error: 'HeyGen devolvio una respuesta que no es JSON al crear',
        respuesta_heygen: createParsed.raw.substring(0, 500),
      });
    }

    const createData = createParsed.data;
    const videoId = createData.data?.video_id || createData.video_id;
    const sessionId = createData.data?.session_id || createData.session_id;

    if (!videoId) {
      console.error('No vino video_id:', createData);
      return res.status(500).json({
        error: 'HeyGen no devolvio video_id',
        detalle: createData,
      });
    }

    console.log('Video Agent iniciado. video_id:', videoId, 'session_id:', sessionId);

    // ============================================================
    // PASO 2: Polling robusto al endpoint /v3/videos/{video_id}
    // ============================================================
    let videoUrl = null;
    let videoPageUrl = null;
    let thumbnailUrl = null;
    let duration = null;
    let intentos = 0;
    // Vercel free tier corta a los 5 minutos. Hacemos polling por max 4 minutos
    // y si no termino, devolvemos link a HeyGen para que el usuario lo abra ahi
    const maxIntentos = 24; // 24 intentos x 10seg = 4 min max

    let errorPollingCount = 0;
    const maxErroresPolling = 5; // si fallan 5 polls seguidos, devolvemos link a HeyGen

    while (intentos < maxIntentos) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // esperar 10 seg
      intentos++;

      let statusResponse;
      try {
        statusResponse = await fetch(
          `https://api.heygen.com/v3/videos/${videoId}`,
          {
            headers: { 'X-Api-Key': HEYGEN_API_KEY },
          }
        );
      } catch (fetchErr) {
        console.log(`Intento ${intentos}: error de red, reintento`);
        errorPollingCount++;
        if (errorPollingCount >= maxErroresPolling) {
          // Demasiados errores seguidos - devolvemos link a HeyGen
          return res.status(202).json({
            success: true,
            still_processing: true,
            video_id: videoId,
            ver_en_heygen: `https://app.heygen.com/videos/${videoId}`,
            mensaje: 'El video sigue procesandose. Abrilo en HeyGen cuando este listo.',
          });
        }
        continue;
      }

      const statusParsed = await safeJson(statusResponse);

      // Si la respuesta NO es JSON, no rompemos: contamos como error suave
      if (!statusParsed.ok) {
        console.log(`Intento ${intentos}: respuesta no-JSON, sigo. Raw: ${statusParsed.raw.substring(0, 100)}`);
        errorPollingCount++;
        if (errorPollingCount >= maxErroresPolling) {
          // HeyGen esta devolviendo basura repetidamente - asumimos que el video se esta
          // generando igual, devolvemos link
          return res.status(202).json({
            success: true,
            still_processing: true,
            video_id: videoId,
            ver_en_heygen: `https://app.heygen.com/videos/${videoId}`,
            mensaje: 'HeyGen esta tardando en responder pero el video sigue en proceso.',
          });
        }
        continue;
      }

      // Si llego aca, hubo respuesta JSON valida - reseteamos contador de errores
      errorPollingCount = 0;

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
          error: 'HeyGen no pudo generar el video',
          detalle: statusData,
        });
      }
    }

    if (!videoUrl) {
      // Llegamos al maximo de intentos sin video listo - devolvemos link a HeyGen
      return res.status(202).json({
        success: true,
        still_processing: true,
        video_id: videoId,
        ver_en_heygen: `https://app.heygen.com/videos/${videoId}`,
        mensaje: 'El video tarda mas de 4 minutos. Probablemente ya este casi listo en tu cuenta de HeyGen.',
      });
    }

    // ============================================================
    // PASO 3: Devolver datos del video
    // ============================================================
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
      error: 'Error al conectar con HeyGen',
      detalle: error.message,
    });
  }
}
