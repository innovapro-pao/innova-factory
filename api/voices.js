// api/voices.js
// Lista voces en 5 idiomas desde HeyGen: español, inglés, portugués, italiano, francés
// Se llama una vez al cargar el modal de avatar, NO consume créditos de video

const IDIOMAS_PERMITIDOS = {
  spanish: 'Español',
  english: 'Inglés',
  portuguese: 'Portugués',
  italian: 'Italiano',
  french: 'Francés',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Solo se acepta GET' });
  }

  const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

  if (!HEYGEN_API_KEY) {
    return res.status(500).json({ error: 'HEYGEN_API_KEY no configurada' });
  }

  try {
    const response = await fetch('https://api.heygen.com/v2/voices', {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.data?.voices) {
      console.error('Error al traer voces:', data);
      return res.status(500).json({
        error: 'HeyGen no devolvio voces',
        detalle: data,
      });
    }

    // Detectar idioma de cada voz (HeyGen usa nombres en ingles tipo "Spanish", "English")
    function detectarIdioma(v) {
      const lang = (v.language || '').toLowerCase();
      if (lang.includes('spanish') || lang.includes('espa') || lang === 'es') return 'spanish';
      if (lang.includes('english') || lang.includes('ingl') || lang === 'en') return 'english';
      if (lang.includes('portug') || lang === 'pt') return 'portuguese';
      if (lang.includes('italian') || lang === 'it') return 'italian';
      if (lang.includes('french') || lang.includes('franc') || lang === 'fr') return 'french';
      return null;
    }

    // Filtrar solo voces de los 5 idiomas que queremos
    const filtradas = data.data.voices.filter((v) => {
      const idioma = detectarIdioma(v);
      return idioma !== null;
    });

    // Agrupar por idioma para que el frontend lo reciba prolijo
    const porIdioma = {};
    for (const idiomaKey of Object.keys(IDIOMAS_PERMITIDOS)) {
      porIdioma[idiomaKey] = [];
    }

    filtradas.forEach((v) => {
      const idiomaKey = detectarIdioma(v);
      if (idiomaKey) {
        porIdioma[idiomaKey].push({
          voice_id: v.voice_id,
          name: (v.name || '').trim(),
          gender: v.gender,
          language: v.language,
        });
      }
    });

    // Cache 1 hora para no llamar todo el tiempo
    res.setHeader('Cache-Control', 'public, max-age=3600');

    return res.status(200).json({
      success: true,
      total: filtradas.length,
      idiomas: IDIOMAS_PERMITIDOS,
      voices_by_language: porIdioma,
      counts: {
        spanish: porIdioma.spanish.length,
        english: porIdioma.english.length,
        portuguese: porIdioma.portuguese.length,
        italian: porIdioma.italian.length,
        french: porIdioma.french.length,
      },
    });
  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({
      error: 'Error al conectar con HeyGen',
      detalle: error.message,
    });
  }
}
