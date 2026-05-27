export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { step, data, landingConfig, capitulo, bono_idx, item } = req.body;
    const key = process.env.ANTHROPIC_API_KEY;
    let prompt = '';

    if (step === 'ebook_indice') {
      prompt = `Eres experto en infoproductos. Crea la estructura de un ebook profesional en español.

Producto: ${data.product}
Público: ${data.audience}
Problema: ${data.problem}
Transformación: ${data.transformation}

Los capítulos deben ser de CONTEXTO, FUNDAMENTOS y ESTRATEGIA. NO incluyas las recetas/técnicas/ítems específicos en los capítulos — esos se generan por separado.

Devuelve SOLO JSON puro sin markdown:
{
  "titulo_principal": "título magnético del ebook",
  "subtitulo": "subtítulo que complementa",
  "introduccion": "introducción de 3 párrafos que engancha al lector, mínimo 200 palabras",
  "capitulos": [
    {"numero": 1, "titulo": "Título capítulo 1", "descripcion": "De qué trata en 2-3 oraciones"},
    {"numero": 2, "titulo": "Título capítulo 2", "descripcion": "De qué trata en 2-3 oraciones"},
    {"numero": 3, "titulo": "Título capítulo 3", "descripcion": "De qué trata en 2-3 oraciones"}
  ],
  "conclusion": "conclusión de 2 párrafos con CTA poderoso"
}`;

    } else if (step === 'ebook_capitulo') {
      prompt = `Eres experto en infoproductos. Escribí el capítulo ${capitulo.numero} de un ebook profesional en español.

Producto: ${data.product}
Público: ${data.audience}
Capítulo: ${capitulo.titulo}
Descripción: ${capitulo.descripcion}

Devuelve SOLO JSON puro sin markdown:
{
  "titulo": "${capitulo.titulo}",
  "intro": "párrafo introductorio del capítulo, 3-4 oraciones",
  "secciones": [
    {
      "subtitulo": "Subtítulo de la sección",
      "contenido": "2-3 párrafos de contenido rico y detallado",
      "bullets": ["punto clave 1", "punto clave 2", "punto clave 3"]
    },
    {
      "subtitulo": "Subtítulo de la sección",
      "contenido": "2-3 párrafos de contenido rico y detallado",
      "bullets": ["punto clave 1", "punto clave 2", "punto clave 3"]
    },
    {
      "subtitulo": "Subtítulo de la sección",
      "contenido": "2-3 párrafos de contenido rico y detallado",
      "bullets": ["punto clave 1", "punto clave 2", "punto clave 3"]
    }
  ],
  "cierre": "párrafo de cierre del capítulo"
}`;

    } else if (step === 'ebook_item_html') {
      const esReceta = item.tipo === 'receta';
      prompt = `Eres experto en infoproductos. Generá el contenido completo de este ítem en español.

Producto: ${data.product}
Público: ${data.audience}
Tipo: ${item.tipo}
Número: ${item.indice} de ${item.total}
Tema: ${item.contexto}
Título sugerido: ${item.titulo}

${esReceta ? `Generá una receta COMPLETA y PROFESIONAL. Devuelve SOLO JSON puro sin markdown:
{
  "titulo": "nombre atractivo de la receta",
  "descripcion": "descripción apetitosa de 2 oraciones que seduce al lector",
  "tiempo": "X min",
  "porciones": "X porciones",
  "dificultad": "Fácil/Media/Difícil",
  "ingredientes": [
    "200g ingrediente con cantidad exacta",
    "2 cucharadas ingrediente",
    "1 taza ingrediente"
  ],
  "pasos": [
    "Paso 1 detallado y específico",
    "Paso 2 detallado y específico",
    "Paso 3 detallado y específico",
    "Paso 4 detallado y específico",
    "Paso 5 detallado y específico",
    "Paso 6 detallado y específico",
    "Paso 7 detallado y específico",
    "Paso 8 detallado y específico"
  ],
  "tip": "tip profesional específico y útil para este ítem",
  "presentacion": "cómo presentar y servir para vender mejor",
  "info_extra": [
    {"label": "Calorías", "valor": "XXX"},
    {"label": "Tiempo prep", "valor": "XX min"},
    {"label": "Dificultad", "valor": "Fácil"},
    {"label": "Porciones", "valor": "X"}
  ]
}` : `Generá el contenido COMPLETO de esta ${item.tipo}. Devuelve SOLO JSON puro sin markdown:
{
  "titulo": "título atractivo",
  "descripcion": "descripción de 2 oraciones que engancha",
  "duracion": "tiempo estimado si aplica",
  "nivel": "Básico/Intermedio/Avanzado",
  "materiales": ["material 1", "material 2", "material 3"],
  "pasos": [
    "Paso 1 detallado",
    "Paso 2 detallado",
    "Paso 3 detallado",
    "Paso 4 detallado",
    "Paso 5 detallado",
    "Paso 6 detallado",
    "Paso 7 detallado",
    "Paso 8 detallado"
  ],
  "tip": "tip profesional clave",
  "resultado_esperado": "qué logra el alumno al completar esto",
  "info_extra": [
    {"label": "Duración", "valor": "XX min"},
    {"label": "Nivel", "valor": "Básico"},
    {"label": "Materiales", "valor": "X items"},
    {"label": "Resultado", "valor": "Inmediato"}
  ]
}`}`;

    } else if (step === 'bono_contenido') {
      const bono = data.bonos[bono_idx];
      prompt = `Eres experto en infoproductos. Creá el contenido completo del bono en español.

Producto: ${data.product}
Público: ${data.audience}
Bono: ${bono.nombre}
Descripción: ${bono.descripcion}

Guía COMPLETA de 500+ palabras en markdown con:
- Introducción
- 4 secciones con subtítulos ##
- Ejemplos prácticos
- Tips accionables
- Conclusión

Sin JSON.`;

    } else if (step === 'landing' && landingConfig) {
      const lc = landingConfig;
      prompt = `Eres copywriter experto en landing pages de alta conversión para LATAM. Genera SOLO JSON puro sin markdown.

Producto: ${data.product}
Público: ${data.audience}
Problema: ${data.problem}
Transformación: ${data.transformation}
Precio: ${data.price}
Precio anterior: ${data.oldprice || ''}
Cuotas: ${data.cuotas || ''}
Promesa: ${lc.promise}
Subpromesa: ${lc.subpromise || ''}
CTA: ${lc.cta || '¡Quiero empezar ahora!'}
Garantía: ${lc.guarantee} días
Bonos: ${JSON.stringify(data.bonos || [])}

JSON exacto:
{
  "preheadline": "frase corta llamativa",
  "headline1": "primera línea título mayúsculas máximo 6 palabras",
  "headline2": "segunda línea con promesa máximo 6 palabras",
  "headline_sub": "frase cursiva poética y directa",
  "marquee_items": ["frase 1","frase 2","frase 3","frase 4"],
  "para_vos_si": [
    {"icon":"🎯","title":"Si querés X","desc":"pero Y, Z."},
    {"icon":"💡","title":"Si querés X","desc":"pero Y, Z."},
    {"icon":"⚡","title":"Si querés X","desc":"pero Y, Z."},
    {"icon":"🏆","title":"Si querés X","desc":"pero Y, Z."},
    {"icon":"🎨","title":"Si querés X","desc":"pero Y, Z."},
    {"icon":"🚀","title":"Si querés X","desc":"pero Y, Z."}
  ],
  "que_vas_aprender": [
    {"title":"TÍTULO","desc":"descripción"},
    {"title":"TÍTULO","desc":"descripción"},
    {"title":"TÍTULO","desc":"descripción"},
    {"title":"TÍTULO","desc":"descripción"},
    {"title":"TÍTULO","desc":"descripción"},
    {"title":"TÍTULO","desc":"descripción"}
  ],
  "logros": [
    {"icon":"⚡","titulo":"TÍTULO","desc":"descripción"},
    {"icon":"🎯","titulo":"TÍTULO","desc":"descripción"},
    {"icon":"🏆","titulo":"TÍTULO","desc":"descripción"},
    {"icon":"💰","titulo":"TÍTULO","desc":"descripción"}
  ],
  "logros_frase": "frase remate máximo 10 palabras",
  "trust_badges": [
    {"icon":"🔒","label":"Compra 100% segura"},
    {"icon":"⚡","label":"Acceso inmediato"},
    {"icon":"⭐","label":"Calidad premium"},
    {"icon":"📄","label":"Sin letras chicas"},
    {"icon":"⏰","label":"Por tiempo limitado"}
  ],
  "testimonials": [
    {"name":"Nombre","place":"Ciudad, País","result":"Resultado","text":"Testimonio 2 oraciones","stars":5},
    {"name":"Nombre","place":"Ciudad, País","result":"Resultado","text":"Testimonio 2 oraciones","stars":5},
    {"name":"Nombre","place":"Ciudad, País","result":"Resultado","text":"Testimonio 2 oraciones","stars":5}
  ],
  "faq": [
    {"q":"¿Cómo recibo el producto?","a":"Respuesta"},
    {"q":"Pregunta 2","a":"Respuesta"},
    {"q":"Pregunta 3","a":"Respuesta"},
    {"q":"Pregunta 4","a":"Respuesta"},
    {"q":"Pregunta 5","a":"Respuesta"}
  ],
  "guarantee_text": "texto garantía",
  "final_headline": "título final máximo 8 palabras",
  "stock_text": "Solo quedan pocos lugares",
  "sold_pct": 73,
  "popup_actions": ["acaba de descargar","activó su acceso","descargó los bonos","ya tiene acceso"]
}`;

    } else {
      const prompts = {
        bonos: `Crea 4 bonos irresistibles en español para:
Producto: ${data.product}, Público: ${data.audience}, Precio: ${data.price}.
SOLO JSON puro:
{
  "bonos": [
    {"nombre":"NOMBRE EN MAYUSCULAS","descripcion":"2-3 líneas","precio_original":"USD 27","emoji":"🎯"},
    {"nombre":"NOMBRE EN MAYUSCULAS","descripcion":"2-3 líneas","precio_original":"USD 37","emoji":"📋"},
    {"nombre":"NOMBRE EN MAYUSCULAS","descripcion":"2-3 líneas","precio_original":"USD 47","emoji":"⚡"},
    {"nombre":"NOMBRE EN MAYUSCULAS","descripcion":"2-3 líneas","precio_original":"USD 27","emoji":"🏆"}
  ],
  "valor_total": "USD 138",
  "frase_remate": "frase poderosa máximo 10 palabras"
}`,

        copies: `Copywriter AIDA experto en español para: Producto: ${data.product}, Público: ${data.audience}, Precio: ${data.price}.
1. 5 emails de lanzamiento completos
2. 5 posts Instagram con hashtags
3. 7 scripts de stories
4. 3 anuncios Facebook/Instagram
5. 2 mensajes WhatsApp`,

        creativos: `Eres un director creativo experto en publicidad digital para LATAM. Generá 3 anuncios publicitarios para este producto. Devuelve SOLO JSON puro sin markdown:

Producto: ${data.product}
Público: ${data.audience}
Precio: ${data.price}
Transformación: ${data.transformation}

{
  "anuncios": [
    {
      "id": 1,
      "estilo": "urgencia",
      "titulo": "TÍTULO IMPACTANTE EN MAYÚSCULAS máximo 5 palabras",
      "subtitulo": "frase que complementa el título máximo 8 palabras",
      "cuerpo": "beneficio principal en 1 línea corta",
      "cta": "texto del botón máximo 4 palabras",
      "precio": "${data.price}",
      "precio_tachado": "${data.oldprice || ''}",
      "prompt_fondo": "prompt en inglés para DALL-E 3: fondo visual premium sin texto, relacionado al producto, estilo publicitario profesional, dark moody background, cinematic lighting, no text no words no people no faces"
    },
    {
      "id": 2,
      "estilo": "aspiracional",
      "titulo": "TÍTULO ASPIRACIONAL EN MAYÚSCULAS máximo 5 palabras",
      "subtitulo": "frase emotiva que conecta con el sueño del público",
      "cuerpo": "transformación que logra el producto en 1 línea",
      "cta": "texto del botón máximo 4 palabras",
      "precio": "${data.price}",
      "precio_tachado": "${data.oldprice || ''}",
      "prompt_fondo": "prompt en inglés para DALL-E 3: fondo visual lifestyle premium sin texto, estilo aspiracional, beautiful lighting, professional photography aesthetic, no text no words no people no faces"
    },
    {
      "id": 3,
      "estilo": "oferta",
      "titulo": "TÍTULO DE OFERTA EN MAYÚSCULAS máximo 5 palabras",
      "subtitulo": "frase de escasez o tiempo limitado",
      "cuerpo": "qué incluye el paquete en 1 línea",
      "cta": "texto del botón máximo 4 palabras",
      "precio": "${data.price}",
      "precio_tachado": "${data.oldprice || ''}",
      "prompt_fondo": "prompt en inglés para DALL-E 3: fondo visual premium de producto digital, dark luxury background, gold accents, no text no words no people no faces"
    }
  ],
  "paleta": {
    "primario": "#color hex que va con el producto",
    "secundario": "#color hex complementario",
    "acento": "#color hex para CTAs y precios"
  }
}`,

        trafico: `Experto en tráfico digital para: ${data.product}, Público: ${data.audience}, Precio: ${data.price}.
1. Plan orgánico 30 días detallado
2. Estrategia Facebook/Instagram Ads con presupuesto
3. Funnel de ventas completo
4. Cronograma lanzamiento 2 semanas
5. KPIs y métricas clave`,
      };
      prompt = prompts[step] || `Genera contenido profesional en español para: ${data.product}. Módulo: ${step}.`;
    }

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const json = await r.json();
    let text = json?.content?.[0]?.text || 'Error al generar contenido';

    if (step === 'bonos') {
      try {
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(clean);
        return res.status(200).json({ content: text, bonos: parsed.bonos, frase_remate: parsed.frase_remate, valor_total: parsed.valor_total, step });
      } catch(e) {
        return res.status(200).json({ content: text, step });
      }
    }

    if (step === 'ebook_indice' || step === 'ebook_capitulo' || step === 'ebook_item_html') {
      try {
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(clean);
        return res.status(200).json({ content: parsed, step, isJson: true });
      } catch(e) {
        return res.status(200).json({ content: text, step, isJson: false });
      }
    }

    if (step === 'landing' && landingConfig) {
      try {
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(text);
        return res.status(200).json({ content: parsed, step, isJson: true });
      } catch(e) {
        return res.status(200).json({ content: text, step, isJson: false });
      }
    }

    if (step === 'creativos') {
      try {
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(clean);
        return res.status(200).json({ content: parsed, step, isJson: true });
      } catch(e) {
        return res.status(200).json({ content: text, step, isJson: false });
      }
    }

    return res.status(200).json({ content: text, step });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
