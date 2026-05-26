export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { step, data, landingConfig, capitulo, bono_idx } = req.body;
    const key = process.env.ANTHROPIC_API_KEY;
    let prompt = '';

    if (step === 'ebook_indice') {
      prompt = `Eres experto en infoproductos digitales. Crea la estructura completa de un ebook profesional en español.

Producto: ${data.product}
Público: ${data.audience}
Problema: ${data.problem}
Transformación: ${data.transformation}
Contenido específico requerido: ${data.contenido_especifico || 'no especificado'}

Devuelve SOLO JSON puro sin markdown:
{
  "titulo_principal": "título magnético del ebook",
  "subtitulo": "subtítulo que complementa",
  "introduccion": "introducción de 200 palabras que engancha al lector",
  "capitulos": [
    {"numero": 1, "titulo": "Título del capítulo 1", "descripcion": "De qué trata en 1 oración"},
    {"numero": 2, "titulo": "Título del capítulo 2", "descripcion": "De qué trata en 1 oración"},
    {"numero": 3, "titulo": "Título del capítulo 3", "descripcion": "De qué trata en 1 oración"},
    {"numero": 4, "titulo": "Título del capítulo 4", "descripcion": "De qué trata en 1 oración"},
    {"numero": 5, "titulo": "Título del capítulo 5", "descripcion": "De qué trata en 1 oración"},
    {"numero": 6, "titulo": "Título del capítulo 6", "descripcion": "De qué trata en 1 oración"},
    {"numero": 7, "titulo": "Título del capítulo 7", "descripcion": "De qué trata en 1 oración"}
  ],
  "conclusion": "conclusión de 150 palabras con CTA poderoso"
}`;

    } else if (step === 'ebook_capitulo') {
      prompt = `Eres experto en infoproductos. Escribí el capítulo ${capitulo.numero} de un ebook profesional en español.

Producto: ${data.product}
Público: ${data.audience}
Capítulo: ${capitulo.titulo}
Descripción: ${capitulo.descripcion}
Contenido específico requerido: ${data.contenido_especifico || ''}

Escribí un capítulo COMPLETO y DETALLADO de exactamente 600 palabras. Incluí:
- Introducción del capítulo
- 3 secciones con subtítulos ## 
- Ejemplos prácticos y concretos relacionados al contenido específico requerido
- Tips accionables numerados
- Cierre del capítulo

Escribí directamente en markdown. Sin JSON. Sin intro tipo "aquí está el capítulo".`;

    } else if (step === 'bono_contenido') {
      const bono = data.bonos[bono_idx];
      prompt = `Eres experto en infoproductos. Creá el contenido completo del siguiente bono digital en español.

Producto principal: ${data.product}
Público: ${data.audience}
Bono: ${bono.nombre}
Descripción del bono: ${bono.descripcion}
Contenido específico: ${data.contenido_especifico || ''}

Escribí una guía/mini ebook COMPLETO de mínimo 500 palabras. Incluí:
- Introducción
- 4 secciones con subtítulos ##
- Ejemplos prácticos
- Tips accionables
- Conclusión con próximos pasos

Formato markdown. Sin JSON.`;

    } else if (step === 'landing' && landingConfig) {
      const lc = landingConfig;
      prompt = `Eres copywriter experto en landing pages de alta conversión para LATAM. Genera SOLO JSON puro sin markdown ni explicaciones.

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
Bonos del producto: ${JSON.stringify(data.bonos || [])}

Devuelve EXACTAMENTE este JSON:
{
  "preheadline": "frase corta llamativa tipo ATENCIÓN para el público específico",
  "headline1": "primera línea del título en mayúsculas máximo 6 palabras",
  "headline2": "segunda línea del título con la promesa clave máximo 6 palabras",
  "headline_sub": "frase en cursiva dentro de un recuadro poética y directa",
  "marquee_items": ["frase corta 1","frase corta 2","frase corta 3","frase corta 4"],
  "para_vos_si": [
    {"icon":"🎯","title":"Si querés X","desc":"pero Y, Z."},
    {"icon":"💡","title":"Si querés X","desc":"pero Y, Z."},
    {"icon":"⚡","title":"Si querés X","desc":"pero Y, Z."},
    {"icon":"🏆","title":"Si querés X","desc":"pero Y, Z."},
    {"icon":"🎨","title":"Si querés X","desc":"pero Y, Z."},
    {"icon":"🚀","title":"Si querés X","desc":"pero Y, Z."}
  ],
  "que_vas_aprender": [
    {"title":"TÍTULO EN MAYÚSCULAS","desc":"descripción corta persuasiva"},
    {"title":"TÍTULO EN MAYÚSCULAS","desc":"descripción corta persuasiva"},
    {"title":"TÍTULO EN MAYÚSCULAS","desc":"descripción corta persuasiva"},
    {"title":"TÍTULO EN MAYÚSCULAS","desc":"descripción corta persuasiva"},
    {"title":"TÍTULO EN MAYÚSCULAS","desc":"descripción corta persuasiva"},
    {"title":"TÍTULO EN MAYÚSCULAS","desc":"descripción corta persuasiva"}
  ],
  "logros": [
    {"icon":"⚡","titulo":"TÍTULO EN MAYÚSCULAS","desc":"descripción corta del logro"},
    {"icon":"🎯","titulo":"TÍTULO EN MAYÚSCULAS","desc":"descripción corta del logro"},
    {"icon":"🏆","titulo":"TÍTULO EN MAYÚSCULAS","desc":"descripción corta del logro"},
    {"icon":"💰","titulo":"TÍTULO EN MAYÚSCULAS","desc":"descripción corta del logro"}
  ],
  "logros_frase": "frase remate poderosa máximo 10 palabras",
  "trust_badges": [
    {"icon":"🔒","label":"Compra 100% segura"},
    {"icon":"⚡","label":"Acceso inmediato"},
    {"icon":"⭐","label":"Calidad premium"},
    {"icon":"📄","label":"Sin letras chicas"},
    {"icon":"⏰","label":"Por tiempo limitado"}
  ],
  "testimonials": [
    {"name":"Nombre Apellido","place":"Ciudad, País","result":"Resultado concreto","text":"Testimonio persuasivo de 2 oraciones","stars":5},
    {"name":"Nombre Apellido","place":"Ciudad, País","result":"Resultado concreto","text":"Testimonio persuasivo de 2 oraciones","stars":5},
    {"name":"Nombre Apellido","place":"Ciudad, País","result":"Resultado concreto","text":"Testimonio persuasivo de 2 oraciones","stars":5}
  ],
  "faq": [
    {"q":"¿Cómo recibo el producto después de pagar?","a":"Respuesta clara"},
    {"q":"Pregunta frecuente 2","a":"Respuesta clara"},
    {"q":"Pregunta frecuente 3","a":"Respuesta clara"},
    {"q":"Pregunta frecuente 4","a":"Respuesta clara"},
    {"q":"Pregunta frecuente 5","a":"Respuesta clara"}
  ],
  "guarantee_text": "texto persuasivo garantía",
  "final_headline": "título final poderoso máximo 8 palabras",
  "stock_text": "Solo quedan pocos lugares disponibles",
  "sold_pct": 73,
  "popup_actions": [
    "acaba de descargar el producto",
    "activó su acceso ahora mismo",
    "descargó los bonos del pack",
    "ya tiene su acceso listo"
  ]
}`;

    } else {
      const prompts = {
        bonos: `Eres experto en lanzamientos. Crea exactamente 4 bonos irresistibles en español para:
Producto: ${data.product}, Publico: ${data.audience}, Precio: ${data.price}.
Devuelve SOLO JSON puro sin markdown:
{
  "bonos": [
    {"nombre":"NOMBRE DEL BONO EN MAYUSCULAS","descripcion":"descripción 2-3 líneas","precio_original":"USD 27","emoji":"🎯"},
    {"nombre":"NOMBRE DEL BONO EN MAYUSCULAS","descripcion":"descripción 2-3 líneas","precio_original":"USD 37","emoji":"📋"},
    {"nombre":"NOMBRE DEL BONO EN MAYUSCULAS","descripcion":"descripción 2-3 líneas","precio_original":"USD 47","emoji":"⚡"},
    {"nombre":"NOMBRE DEL BONO EN MAYUSCULAS","descripcion":"descripción 2-3 líneas","precio_original":"USD 27","emoji":"🏆"}
  ],
  "valor_total": "USD 138",
  "frase_remate": "frase poderosa de cierre máximo 10 palabras"
}`,
        copies: `Eres copywriter AIDA experto. Genera en español para: Producto: ${data.product}, Publico: ${data.audience}, Precio: ${data.price}.
1. Secuencia 5 emails lanzamiento completos
2. 5 posts Instagram con caption largo y hashtags
3. 7 scripts de stories paso a paso
4. 3 anuncios Facebook/Instagram Ads completos
5. 2 mensajes WhatsApp difusion`,
        creativos: `Eres director creativo senior. Crea briefs detallados para: Producto: ${data.product}.
1. Brief portada ebook completo
2. Brief banner 1080x1080 y 1080x1920
3. Descripcion 6 slides carrusel
4. Paleta de marca completa HEX + tipografias
5. 5 prompts Midjourney/DALL-E listos para copiar`,
        trafico: `Eres experto en trafico digital. Estrategia completa para: Producto: ${data.product}, Publico: ${data.audience}, Precio: ${data.price}.
1. Plan organico 30 dias
2. Estrategia Facebook/Instagram Ads
3. Funnel ventas completo
4. Cronograma lanzamiento ultimas 2 semanas
5. KPIs y metricas de exito`,
      };
      prompt = prompts[step] || `Genera contenido profesional en español para: ${data.product}, publico: ${data.audience}. Modulo: ${step}.`;
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

    if (step === 'ebook_indice') {
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

    return res.status(200).json({ content: text, step });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
