// api/video-avatar.js
// Genera un video con avatar parado hablando, usando voz y avatar elegidos
// Endpoint creacion: POST /v2/video/generate
// Endpoint polling:  GET  /v1/video_status.get?video_id={id}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo se acepta POST' });
  }

  const { script, voice_id, avatar_id, dimension } = req.body;

  if (!script || script.trim().length === 0) {
    return res.status(400).json({ error: 'Falta el guion (script)' });
  }

  if (!voice_id) {
    return res.status(400).json({ error: 'Falta el voice_id' });
  }

  // Avatar por defecto si el usuario no eligio uno (avatar publico gratuito)
  const avatarFinal = avatar_id || 'Daisy-inskirt-20220818';

  // Dimensiones por defecto 9:16 vertical (formato reels)
  const dimensionFinal = dimension || { width: 720, height: 1280 };

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
    // ============================================================
    // PASO 1: Crear video con avatar simple
    // ============================================================
    const createResponse = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: avatarFinal,
              avatar_style: 'normal',
            },
            voice: {
              type: 'text',
              input_text: script,
              voice_id: voice_id,
            },
          },
        ],
        dimension: dimensionFinal,
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
      return res.status(500).json({
        error: 'HeyGen devolvio respuesta no-JSON',
        respuesta_heygen: createParsed.raw.substring(0, 500),
      });
    }

    const videoId = createParsed.data.data?.video_id || createParsed.data.video_id;

    if (!videoId) {
      return res.status(500).json({
        error: 'HeyGen no devolvio video_id',
        detalle: createParsed.data,
      });
    }

    console.log('Avatar video iniciado. video_id:', videoId);

    // ============================================================
    // PASO 2: Polling con endpoint clasico
    // ============================================================
    let videoUrl = null;
    let thumbnailUrl = null;
    let duration = null;
    let intentos = 0;
    const maxIntentos = 60; // 60 x 5seg = 5 min

    while (intentos < maxIntentos) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      intentos++;

      const statusResponse = await fetch(
        `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
        {
          headers: { 'X-Api-Key': HEYGEN_API_KEY },
        }
      );

      const statusParsed = await safeJson(statusResponse);

      if (!statusParsed.ok) {
        console.log(`Intento ${intentos}: respuesta no-JSON, sigo`);
        continue;
      }

      const statusData = statusParsed.data;
      const status = statusData.data?.status;
      const url = statusData.data?.video_url;
      const thumb = statusData.data?.thumbnail_url;
      const dur = statusData.data?.duration;

      console.log(`Intento ${intentos}: status="${status}"`);

      if (status === 'completed' && url) {
        videoUrl = url;
        thumbnailUrl = thumb;
        duration = dur;
        break;
      }

      if (status === 'failed') {
        return res.status(500).json({
          error: 'HeyGen no pudo generar el video',
          detalle: statusData,
        });
      }
    }

    if (!videoUrl) {
      return res.status(504).json({
        error: 'El video tardo mas de 5 minutos. Revisa tu cuenta de HeyGen.',
        video_id: videoId,
      });
    }

    return res.status(200).json({
      success: true,
      video_url: videoUrl,
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
