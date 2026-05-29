// api/clip.js
// Inicia la generacion de un clip cinematografico con Veo 3.1 Fast
// Endpoint: POST /v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning
//
// Recibe: { prompt, aspect_ratio, duration_seconds }
// Devuelve: { operation_name } - se usa con /api/clip-check para polling

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo POST' });
  }

  const { prompt, aspect_ratio = '9:16', duration_seconds = 8 } = req.body || {};

  if (!prompt || prompt.trim().length < 10) {
    return res.status(400).json({ error: 'El prompt es muy corto' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel' });
  }

  // Modelo: veo-3.1-fast-generate-preview (calidad + audio)
  const MODEL = 'veo-3.1-fast-generate-preview';
  const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predictLongRunning`;

  // Validar parametros
  const validAspectRatios = ['16:9', '9:16'];
  const finalAspect = validAspectRatios.includes(aspect_ratio) ? aspect_ratio : '9:16';
  // Veo 3.1 Fast en preview SOLO acepta durationSeconds: 8 (valor fijo)
  // Los rangos 4-8 son del modelo Standard, no del Fast
  const finalDuration = 8;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt,
          },
        ],
        parameters: {
          aspectRatio: finalAspect,
          durationSeconds: finalDuration,
          personGeneration: 'allow_all',
        },
      }),
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error('Respuesta no-JSON al crear:', raw);
      return res.status(500).json({
        error: 'Error al iniciar la generacion del video',
        detalle: raw.substring(0, 500),
      });
    }

    if (!response.ok) {
      console.error('API rechazo el pedido:', response.status, data);
      // Errores comunes
      let mensajeAmigable = 'No se pudo iniciar el video';
      if (response.status === 403 || data.error?.code === 403) {
        mensajeAmigable = 'Tu API key no tiene acceso a Veo 3. Activá facturación en Google Cloud.';
      } else if (response.status === 429) {
        mensajeAmigable = 'Demasiados pedidos. Esperá un minuto y reintentá.';
      } else if (data.error?.message) {
        mensajeAmigable = data.error.message;
      }
      return res.status(500).json({
        error: mensajeAmigable,
        status_code: response.status,
        detalle: data.error || data,
      });
    }

    // La respuesta tiene un campo "name" con el ID de la operacion
    // Ej: "models/veo-3.1-fast-generate-preview/operations/abc123"
    const operationName = data.name;
    if (!operationName) {
      console.error('No vino operation name:', data);
      return res.status(500).json({
        error: 'No se pudo identificar la operacion',
        detalle: data,
      });
    }

    console.log('Veo iniciado. operation:', operationName);

    return res.status(200).json({
      success: true,
      operation_name: operationName,
      aspect_ratio: finalAspect,
      duration_seconds: finalDuration,
    });
  } catch (error) {
    console.error('Error general en clip.js:', error);
    return res.status(500).json({
      error: 'Error al conectar con Veo 3',
      detalle: error.message,
    });
  }
}
