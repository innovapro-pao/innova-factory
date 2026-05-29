// api/video-check.js
// Chequea el estado de un video por su ID
// Es muy rapido (1 sola llamada a HeyGen) - NUNCA hay timeout

export default async function handler(req, res) {
  // Acepta GET con ?video_id=xxx O POST con {video_id:xxx}
  let videoId;
  if (req.method === 'GET') {
    videoId = req.query.video_id;
  } else if (req.method === 'POST') {
    videoId = req.body?.video_id;
  } else {
    return res.status(405).json({ error: 'Solo GET o POST' });
  }

  if (!videoId) {
    return res.status(400).json({ error: 'Falta video_id' });
  }

  const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

  if (!HEYGEN_API_KEY) {
    return res.status(500).json({ error: 'API_KEY no configurada' });
  }

  try {
    const statusResponse = await fetch(
      `https://api.heygen.com/v3/videos/${videoId}`,
      { headers: { 'X-Api-Key': HEYGEN_API_KEY } }
    );

    const raw = await statusResponse.text();

    // Si HeyGen devuelve no-JSON, devolvemos "processing" para que el frontend siga intentando
    let statusData;
    try {
      statusData = JSON.parse(raw);
    } catch (e) {
      console.log('Respuesta no-JSON, devuelvo processing:', raw.substring(0, 100));
      return res.status(200).json({
        status: 'processing',
        video_id: videoId,
      });
    }

    const status = statusData.data?.status || statusData.status;
    const url = statusData.data?.video_url || statusData.video_url;
    const pageUrl = statusData.data?.video_page_url || statusData.video_page_url;
    const thumb = statusData.data?.thumbnail_url || statusData.thumbnail_url;
    const dur = statusData.data?.duration || statusData.duration;

    // Si tiene URL, esta listo
    if (status === 'completed' || status === 'success' || url) {
      if (url) {
        return res.status(200).json({
          status: 'completed',
          video_id: videoId,
          video_url: url,
          video_page_url: pageUrl,
          thumbnail_url: thumb,
          duration: dur,
        });
      }
    }

    // Si fallo
    if (status === 'failed' || status === 'error') {
      return res.status(200).json({
        status: 'failed',
        video_id: videoId,
        error: 'No se pudo generar el video',
      });
    }

    // Si no, sigue procesando
    return res.status(200).json({
      status: status || 'processing',
      video_id: videoId,
    });
  } catch (error) {
    console.error('Error chequeando video:', error);
    // En caso de error de red, devolvemos processing (el frontend reintenta)
    return res.status(200).json({
      status: 'processing',
      video_id: videoId,
    });
  }
}
