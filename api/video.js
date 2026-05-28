// api/video.js
// Genera un video completo (multi-escena) usando HeyGen Video Agent
// El Video Agent recibe un prompt grande y arma escenas + B-roll + voz + música solo

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

  try {
    // ============================================================
    // PASO 1: Crear sesion de Video Agent y mandar el prompt
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

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.error('Error al crear Video Agent:', createData);
      return res.status(500).json({
        error: 'HeyGen rechazo el pedido',
        detalle: createData,
      });
    }

    // El Video Agent puede devolver session_id o video_id segun la version
    const sessionId = createData.data?.session_id || createData.session_id;
    const videoId = createData.data?.video_id || createData.video_id;
    const idParaConsultar = videoId || sessionId;

    if (!idParaConsultar) {
      return res.status(500).json({
        error: 'HeyGen no devolvio un ID para consultar',
        detalle: createData,
      });
    }

    console.log('Video Agent iniciado, ID:', idParaConsultar);

    // ============================================================
    // PASO 2: Esperar a que el Video Agent termine (polling)
    // El Video Agent tarda mas que avatar simple: 3 a 8 minutos tipico
    // ============================================================
    let videoUrl = null;
    let intentos = 0;
    const maxIntentos = 120; // Hasta 10 minutos (5 seg x 120)

    while (intentos < maxIntentos) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      intentos++;

      // Probamos primero el endpoint v3 de video agent
      let statusResponse = await fetch(
        `https://api.heygen.com/v3/video-agents/${idParaConsultar}`,
        {
          headers: { 'X-Api-Key': HEYGEN_API_KEY },
        }
      );

      // Si v3 no devuelve, probamos el endpoint clasico de video_status
      if (!statusResponse.ok) {
        statusResponse = await fetch(
          `https://api.heygen.com/v1/video_status.get?video_id=${idParaConsultar}`,
          {
            headers: { 'X-Api-Key': HEYGEN_API_KEY },
          }
        );
      }

      const statusData = await statusResponse.json();
      const status = statusData.data?.status || statusData.status;
      const url = statusData.data?.video_url || statusData.video_url || statusData.data?.url;

      console.log(`Intento ${intentos}: estado = ${status}`);

      if (status === 'completed' || status === 'success' || url) {
        videoUrl = url || statusData.data?.video_url;
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
      return res.status(504).json({
        error: 'El video tardo demasiado (mas de 10 minutos). HeyGen puede seguir generandolo - revisa tu cuenta de HeyGen en unos minutos.',
      });
    }

    // ============================================================
    // PASO 3: Devolver la URL del video
    // ============================================================
    return res.status(200).json({
      success: true,
      video_url: videoUrl,
      video_id: idParaConsultar,
    });
  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({
      error: 'Error al conectar con HeyGen',
      detalle: error.message,
    });
  }
}
