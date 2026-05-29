// api/clip-download.js
// Proxy: descarga el video desde Google Cloud usando la API key como header
// Sin esto, el browser no puede acceder al video porque Google requiere autenticación

export default async function handler(req, res) {
  const { uri } = req.query;

  if (!uri) {
    return res.status(400).json({ error: 'Falta uri' });
  }

  // Validar que la URI sea de Google (seguridad)
  if (!uri.includes('generativelanguage.googleapis.com')) {
    return res.status(400).json({ error: 'URI no permitida' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });
  }

  try {
    // Descargar el video de Google
    const videoRes = await fetch(uri, {
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
      },
    });

    if (!videoRes.ok) {
      console.error('Download falló:', videoRes.status);
      return res.status(videoRes.status).json({ error: 'No se pudo descargar el video' });
    }

    // Pasar el video al cliente
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="innova_clip.mp4"');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Convertir el response stream a buffer y devolverlo
    const buffer = Buffer.from(await videoRes.arrayBuffer());
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Error descargando video:', error);
    return res.status(500).json({ error: 'Error al descargar el video' });
  }
}
