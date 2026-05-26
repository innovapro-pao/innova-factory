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
      prompt = `Eres experto en infoproductos digitales. Crea la estructura de un ebook profesional en español.

Producto: ${data.product}
Público: ${data.audience}
Problema: ${data.problem}
Transformación: ${data.transformation}

IMPORTANTE: Los capítulos NO deben incluir las recetas/técnicas/ejercicios específicos — esos se generan por separado.
Los capítulos deben ser de CONTEXTO, FUNDAMENTOS y ESTRATEGIA.

Devuelve SOLO JSON puro sin markdown:
{
  "titulo_principal": "título magnético del ebook",
  "subtitulo": "subtítulo que complementa",
  "introduccion": "introducción de 200 palabras que engancha al lector",
  "capitulos": [
    {"numero": 1, "titulo": "Título capítulo 1", "descripcion": "De qué trata en 1 oración"},
    {"numero": 2, "titulo": "Título capítulo 2", "descripcion": "De qué trata en 1 oración"},
    {"numero": 3, "titulo": "Título capítulo 3", "descripcion": "De qué trata en 1 oración"},
    {"numero": 4, "titulo": "Título capítulo 4", "descripcion": "De qué trata en 1 oración"},
    {"numero": 5, "titulo": "Título capítulo 5", "descripcion": "De qué trata en 1 oración"}
  ],
  "conclusion": "conclusión de 150 palabras con CTA poderoso"
}`;

    } else if (step === 'ebook_capitulo') {
      prompt = `Eres experto en infoproductos. Escribí el capítulo ${capitulo.numero} de un ebook profesional en español.

Producto: ${data.product}
Público: ${data.audience}
Capítulo: ${capitulo.titulo}
Descripción: ${capitulo.descripcion}

Escribí un capítulo COMPLETO de 500 palabras en markdown con:
- Introducción
- 3 secciones con subtítulos ##
- Ejemplos prácticos
- Tips numerados
- Cierre

Sin JSON. Sin intro tipo "aquí está el capítulo".`;

    } else if (step === 'ebook_item') {
      prompt = `Eres experto en infoproductos. Desarrollá este ítem de forma COMPLETA y DETALLADA en español.

Producto: ${data.product}
Público: ${data.audience}
Tipo: ${item.tipo}
Número: ${item.numero}
Título: ${item.titulo}
Contexto adicional: ${item.contexto || ''}

${item.tipo === 'receta' ? `Desarrollá la receta COMPLETA con:
## Ingredientes
- Lista detallada con cantidades exactas en gramos/ml/unidades

## Preparación paso a paso
1. Paso numerado con detalle
2. Paso numerado con detalle
(mínimo 8 pasos detallados)

## Tiempo y porciones
- Tiempo de preparación, cocción y total
- Cantidad de porciones

## Tips profesionales
- 3 tips para vender mejor este producto

## Variaciones
- 2 variaciones de la receta base` : ''}

${item.tipo === 'técnica' ? `Desarrollá la técnica COMPLETA con:
## Qué es y para qué sirve
## Materiales necesarios
## Paso a paso detallado (mínimo 8 pasos)
## Errores comunes a evitar
## Tips pro` : ''}

${item.tipo === 'ejercicio' ? `Desarrollá el ejercicio COMPLETO con:
## Descripción y beneficios
## Músculos trabajados
## Paso a paso (mínimo 8 pasos con detalle)
## Variaciones y progresiones
## Precauciones` : ''}

${!['receta','técnica','ejercicio'].includes(item.tipo) ? `Desarrollá el contenido COMPLETO con:
## Introducción
## Desarrollo detallado paso a paso (mínimo 8 pasos)
## Ejemplos prácticos
## Tips y recomendaciones
## Conclusión` : ''}

Mínimo 500 palabras. Sin JSON. Directo al contenido.`;

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
        copies: `Copywriter AIDA experto. Para: Producto: ${data.product}, Público: ${data.audience}, Precio: ${data.price}.
1. 5 emails de lanzamiento completos
2. 5 posts Instagram con hashtags
3. 7 scripts de stories
4. 3 anuncios Facebook/Instagram
5. 2 mensajes WhatsApp`,
        creativos: `Director creativo. Para: ${data.product}.
1. Brief portada ebook
2. Brief banner 1080x1080 y 1080x1920
3. 6 slides carrusel
4. Paleta de marca HEX + tipografías
5. 5 prompts Midjourney/DALL-E`,
        trafico: `Experto en tráfico digital. Para: ${data.product}, Público: ${data.audience}, Precio: ${data.price}.
1. Plan orgánico 30 días
2. Estrategia Facebook/Instagram Ads
3. Funnel de ventas completo
4. Cronograma lanzamiento 2 semanas
5. KPIs y métricas`,
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
