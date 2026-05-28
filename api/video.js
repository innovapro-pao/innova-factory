// api/video.js
// Genera un video con avatar usando HeyGen API
// Patrón: pedir video → esperar (polling) → devolver URL del video

export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo se acepta POST' });
  }

  // Datos que envía el usuario desde el navegador
  const { script } = req.body;

  if (!script || script.trim().length === 0) {
    return res.status(400).json({ error: 'Falta el guion del video (script)' });
  }

  const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

  if (!HEYGEN_API_KEY) {
    return res.status(500).json({ error: 'HEYGEN_API_KEY no configurada en Vercel' });
  }

  try {
    // ============================================================
    // PASO 1: Pedirle a HeyGen que genere el video
    // ============================================================
    const generateResponse = await fetch('https://api.heygen.com/v2/video/generate', {
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
              avatar_id: 'Daisy-inskirt-20220818', // Avatar gratis por defecto
              avatar_style: 'normal',
            },
            voice: {
              type: 'text',
              input_text: script,
              voice_id: '2d5b0e6cf36f460aa7fc47e3eee4ba54', // Voz en español
            },
          },
        ],
        dimension: {
          width: 720,
          height: 1280, // Vertical 9:16 (formato Reels)
        },
      }),
    });

    const generateData = await generateResponse.json();

    if (!generateResponse.ok || !generateData.data?.video_id) {
      console.error('Error al generar video:', generateData);
      return res.status(500).json({
        error: 'HeyGen rechazó el pedido',
        detalle: generateData,
      });
    }

    const videoId = generateData.data.video_id;
    console.log('Video ID recibido:', videoId);

    // ============================================================
    // PASO 2: Esperar a que HeyGen termine de generar (polling)
    // ============================================================
    let videoUrl = null;
    let intentos = 0;
    const maxIntentos = 60; // Hasta 5 minutos esperando (5 seg x 60)

    while (intentos < maxIntentos) {
      // Esperar 5 segundos antes de preguntar otra vez
      await new Promise((resolve) => setTimeout(resolve, 5000));
      intentos++;

      const statusResponse = await fetch(
        `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
        {
          headers: {
            'X-Api-Key': HEYGEN_API_KEY,
          },
        }
      );

      const statusData = await statusResponse.json();
      const status = statusData.data?.status;

      console.log(`Intento ${intentos}: estado = ${status}`);

      if (status === 'completed') {
        videoUrl = statusData.data.video_url;
        break;
      }

      if (status === 'failed') {
        return res.status(500).json({
          error: 'HeyGen no pudo generar el video',
          detalle: statusData,
        });
      }

      // Si está 'processing' o 'pending', seguimos esperando
    }

    if (!videoUrl) {
      return res.status(504).json({
        error: 'El video tardó demasiado en generarse (más de 5 minutos)',
      });
    }

    // ============================================================
    // PASO 3: Devolver la URL del video al navegador
    // ============================================================
    return res.status(200).json({
      success: true,
      video_url: videoUrl,
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
