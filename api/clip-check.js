// api/clip-check.js
// Chequea el estado de una operacion de Veo 3 y devuelve la URL del video cuando esta listo
// Acepta GET con ?operation_name=... o POST con {operation_name}

export default async function handler(req, res) {
  let operationName;
  if (req.method === 'GET') {
    operationName = req.query.operation_name;
  } else if (req.method === 'POST') {
    operationName = req.body?.operation_name;
  } else {
    return res.status(405).json({ error: 'Solo GET o POST' });
  }

  if (!operationName) {
    return res.status(400).json({ error: 'Falta operation_name' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });
  }

  // El operation_name viene tipo "models/veo-3.1-fast-generate-preview/operations/abc123"
  // El endpoint de check es: GET /v1beta/{operation_name}
  const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/${operationName}`;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'GET',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
      },
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      // No-JSON: probablemente sigue procesando
      console.log('Check: no-JSON, devuelvo processing');
      return res.status(200).json({
        status: 'processing',
        operation_name: operationName,
      });
    }

    if (!response.ok) {
      console.error('Check no OK:', response.status, data);
      // Si es 404 puede ser que la operacion expiró
      if (response.status === 404) {
        return res.status(200).json({
          status: 'failed',
          error: 'La operacion expiró. Intentá generar de nuevo.',
        });
      }
      return res.status(200).json({
        status: 'failed',
        error: data.error?.message || 'Error al chequear el video',
      });
    }

    // Si no esta listo aun
    if (!data.done) {
      return res.status(200).json({
        status: 'processing',
        operation_name: operationName,
      });
    }

    // Si fallo
    if (data.error) {
      console.error('Veo fallo:', data.error);
      return res.status(200).json({
        status: 'failed',
        error: data.error.message || 'Veo no pudo generar el video',
      });
    }

    // ¡Listo! Extraer la URL del video
    // Estructura: data.response.generateVideoResponse.generatedSamples[0].video.uri
    // O alternativa: data.response.generatedVideos[0].video.uri
    let videoUri = null;

    if (data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri) {
      videoUri = data.response.generateVideoResponse.generatedSamples[0].video.uri;
    } else if (data.response?.generatedVideos?.[0]?.video?.uri) {
      videoUri = data.response.generatedVideos[0].video.uri;
    } else if (data.response?.generatedSamples?.[0]?.video?.uri) {
      videoUri = data.response.generatedSamples[0].video.uri;
    }

    if (!videoUri) {
      console.error('Done pero sin video_uri:', JSON.stringify(data).substring(0, 500));
      return res.status(200).json({
        status: 'failed',
        error: 'No se pudo extraer la URL del video',
        detalle: data.response,
      });
    }

    // La URL viene de Google y necesita la API key para descargar
    // Devolvemos un endpoint nuestro que sirva el video como proxy
    // Ejemplo: /api/clip-download?uri=https://generativelanguage.googleapis.com/...
    const proxyUrl = `/api/clip-download?uri=${encodeURIComponent(videoUri)}`;

    return res.status(200).json({
      status: 'completed',
      operation_name: operationName,
      video_url: proxyUrl,
      original_uri: videoUri,
    });
  } catch (error) {
    console.error('Error chequeando Veo:', error);
    // En caso de error de red, decimos processing para que el frontend reintente
    return res.status(200).json({
      status: 'processing',
      operation_name: operationName,
    });
  }
}
