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
      prompt = `Eres experto en infoproductos. Creá el contenido COMPLETO y EXTENSO del bono en español neutro.
Producto principal: ${data.product}
Público: ${data.audience}
Bono ${bono_idx + 1}: ${bono.nombre}
Descripción: ${bono.descripcion}

REGLAS IMPORTANTES:
- Es un BONO DESCARGABLE en PDF, NO un curso con videos, NO una masterclass, NO una clase en vivo, NO una sesión, NO un webinar.
- NUNCA menciones videos, grabaciones, plataforma de cursos, acceso a clases, ni nada que requiera multimedia. Solo contenido escrito y descargable.
- Si el bono incluye ítems numerados (ej: "5 recetas", "10 plantillas", "7 ejercicios"), enumeralos uno por uno con todo su contenido.
- Si el bono es una pieza única (ej: una guía, un checklist, un cronograma), profundizá en el tema sin inventar ítems internos.

ESTRUCTURA:
Guía COMPLETA de 800-1000 palabras en formato markdown con:
- Introducción inspiradora (1 párrafo de 3-4 oraciones)
- Mínimo 5 secciones con subtítulos ##
- Si el bono incluye ítems numerados, una sección por cada ítem con sus detalles completos
- Ejemplos prácticos y accionables en cada sección
- Tips profesionales destacados con **negrita**
- Conclusión motivadora con próximo paso (1 párrafo)

Devolvé SOLO el contenido en markdown, sin JSON, sin envoltorios.`;
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
        bonos: `Eres experto en infoproductos digitales descargables. Creá 4 bonos irresistibles en español para:
Producto principal: ${data.product}
Público: ${data.audience}
Precio: ${data.price}

REGLAS CRÍTICAS:
- Los bonos son SIEMPRE contenido descargable en PDF (ebooks, guías, plantillas, checklists, planificadores, cronogramas, listas de recursos).
- PROHIBIDO inventar: masterclasses, videos, clases en vivo, webinars, sesiones grabadas, acceso a plataformas, llamadas, mentorías 1 a 1, comunidades, grupos privados, audios, podcasts.
- Variá los tipos de bonos: algunos pueden ser colecciones de ítems numerados (ej: "10 plantillas listas para usar", "7 recetas extra", "5 ejercicios bonus"), otros pueden ser piezas únicas (ej: "Guía de errores comunes", "Checklist de lanzamiento", "Cronograma de 30 días").
- Cada bono debe ser COMPLEMENTARIO al producto principal y aportar valor real.
- En "tipo_contenido" indicá si es "items_numerados" (cuando el bono tiene varios items adentro como recetas/plantillas/ejercicios) o "pieza_unica" (cuando es una sola guía/checklist/cronograma). Esto define cuántas fotos necesita.
- Si es "items_numerados", indicá "cantidad_items" (ej: 5, 7, 10).
- "tema_visual_portada" es una descripción corta en español de qué foto va en la portada del bono (ej: "una libreta abierta sobre un escritorio con flores secas").

Devolvé SOLO JSON puro sin markdown:
{
  "bonos": [
    {"nombre":"NOMBRE EN MAYUSCULAS","descripcion":"2-3 líneas describiendo el valor concreto","precio_original":"USD 27","emoji":"🎯","tipo_contenido":"items_numerados","cantidad_items":5,"tema_visual_portada":"descripción de la portada"},
    {"nombre":"NOMBRE EN MAYUSCULAS","descripcion":"2-3 líneas describiendo el valor concreto","precio_original":"USD 37","emoji":"📋","tipo_contenido":"pieza_unica","cantidad_items":0,"tema_visual_portada":"descripción de la portada"},
    {"nombre":"NOMBRE EN MAYUSCULAS","descripcion":"2-3 líneas describiendo el valor concreto","precio_original":"USD 47","emoji":"⚡","tipo_contenido":"items_numerados","cantidad_items":7,"tema_visual_portada":"descripción de la portada"},
    {"nombre":"NOMBRE EN MAYUSCULAS","descripcion":"2-3 líneas describiendo el valor concreto","precio_original":"USD 27","emoji":"🏆","tipo_contenido":"pieza_unica","cantidad_items":0,"tema_visual_portada":"descripción de la portada"}
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
      "prompt_fondo": "prompt en inglés para generación de imagen: fondo visual premium sin texto, relacionado al producto, estilo publicitario profesional, dark moody background, cinematic lighting, no text no words no people no faces"
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
      "prompt_fondo": "prompt en inglés para generación de imagen: fondo visual lifestyle premium sin texto, estilo aspiracional, beautiful lighting, professional photography aesthetic, no text no words no people no faces"
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
      "prompt_fondo": "prompt en inglés para generación de imagen: fondo visual premium de producto digital, dark luxury background, gold accents, no text no words no people no faces"
    }
  ],
  "paleta": {
    "primario": "#color hex que va con el producto",
    "secundario": "#color hex complementario",
    "acento": "#color hex para CTAs y precios"
  }
}`,
        bono_regenerar: `Eres experto en infoproductos digitales descargables. Creá UN SOLO bono nuevo y DIFERENTE al actual, en español para:
Producto principal: ${data.product}
Público: ${data.audience}
Bono actual que NO te gustó: ${data.bono_actual ? JSON.stringify(data.bono_actual) : ''}

REGLAS CRÍTICAS:
- Generá un bono COMPLETAMENTE DIFERENTE al actual (otro tema, otro tipo, otro enfoque).
- Es contenido descargable en PDF. PROHIBIDO mencionar: masterclasses, videos, clases en vivo, webinars, sesiones, plataformas, llamadas, mentorías, comunidades, audios.
- Tipos válidos: ebooks, guías, plantillas, checklists, planificadores, cronogramas, listas de recursos, recetarios bonus, recopilaciones de ejercicios.
- En "tipo_contenido": "items_numerados" si tiene varios items adentro, "pieza_unica" si es una sola pieza.

Devolvé SOLO JSON puro sin markdown:
{
  "nombre":"NOMBRE EN MAYUSCULAS",
  "descripcion":"2-3 líneas describiendo el valor concreto",
  "precio_original":"USD XX",
  "emoji":"emoji representativo",
  "tipo_contenido":"items_numerados o pieza_unica",
  "cantidad_items": 0,
  "tema_visual_portada":"descripción de la foto de portada en español"
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
    if (step === 'bono_regenerar') {
      try {
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(clean);
        return res.status(200).json({ bono: parsed, step });
      } catch(e) {
        return res.status(200).json({ content: text, step, error: 'No se pudo parsear el bono' });
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
