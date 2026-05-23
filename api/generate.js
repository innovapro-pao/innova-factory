export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { step, data, landingConfig } = req.body;
    const key = process.env.ANTHROPIC_API_KEY;

    let prompt = '';

    if (step === 'landing' && landingConfig) {
      // Build detailed landing prompt from configurator
      const lc = landingConfig;
      const testiList = (lc.testimonials || []).filter(t => t.name).map(t =>
        `- ${t.name} ${t.lastname}: "${t.text}"`).join('\n');
      const badges = [lc.badge1, lc.badge2, lc.badge3].filter(Boolean).join(', ');
      const urgencyList = (lc.urgency || []).join(', ');
      const sectionsList = (lc.sections || []).join(', ');

      prompt = `Eres un experto en diseño web y conversión. Genera un archivo HTML COMPLETO y ESPECTACULAR para una landing page de ventas.

DATOS DEL PRODUCTO:
- Producto: ${data.product}
- Público: ${data.audience}
- Problema: ${data.problem}
- Transformación: ${data.transformation}
- Precio: ${data.price}
- Precio anterior (tachado): ${data.oldprice || 'no especificado'}
- Cuotas: ${data.cuotas || 'no especificado'}
- URL de compra: ${lc.url || '#'}
- Texto del botón CTA: ${lc.cta || '¡Quiero empezar ahora!'}

DISEÑO:
- Color principal: ${lc.color1}
- Color secundario: ${lc.color2}
- Color de fondo: ${lc.colorBg}
- Usar Google Fonts: Syne (títulos) y DM Sans (texto)

PROMESA PRINCIPAL (mostrar en GRANDE, animada, en el hero):
"${lc.promise}"

SUBPROMESA:
"${lc.subpromise || ''}"

BADGES FLOTANTES ANIMADOS: ${badges || 'ninguno'}

ELEMENTOS DE URGENCIA Y ESCASEZ (incluir todos estos):
${urgencyList || 'ninguno'}
${lc.countdownDate ? `- Fecha límite countdown: ${lc.countdownDate}` : ''}
${lc.stockLeft ? `- Cupos/stock restante: ${lc.stockLeft}` : ''}
${lc.soldPct ? `- Porcentaje vendido para barra: ${lc.soldPct}%` : ''}

GARANTÍA: ${lc.guarantee} días - ${lc.guaranteeType || 'devolución total'}

TESTIMONIOS POPUP FOMO (aparecen como notificaciones en la esquina, rotativamente):
${testiList || 'No se especificaron testimonios'}

SECCIONES A INCLUIR: ${sectionsList}

INSTRUCCIONES TÉCNICAS CRÍTICAS:
1. El HTML debe ser COMPLETO, desde <!DOCTYPE html> hasta </html>
2. Todo el CSS va dentro de <style> en el <head>
3. Todo el JavaScript va dentro de <script> al final del <body>
4. Los testimonios popup deben aparecer automáticamente cada 4-5 segundos en la esquina inferior izquierda, con animación slide-in/slide-out
5. Si se pidió countdown timer, que cuente hacia la fecha especificada con horas:minutos:segundos
6. Si se pidió barra de vendidos, mostrarla animada con el porcentaje dado
7. Si se pidió "personas viendo ahora", mostrar un número que varía aleatoriamente entre 12 y 47
8. Los badges flotantes deben tener una animación de pulso o bounce
9. La promesa principal debe tener una animación de entrada impactante (fadeIn, slideUp, o typewriter)
10. Múltiples botones CTA a lo largo de la página
11. La página debe ser 100% responsive (mobile first)
12. Usar gradientes con los colores especificados
13. Sección hero con fondo oscuro + gradiente
14. Incluir sección de precio con el precio tachado y el precio real en grande
15. Footer con información de garantía

EXTRA SOLICITADO: ${lc.extra || 'ninguno'}

IMPORTANTE: Devuelve SOLO el código HTML completo, sin explicaciones, sin markdown, sin bloques de código. Empieza directamente con <!DOCTYPE html>`;

    } else {
      const prompts = {
        ebook: `Eres experto en infoproductos. Crea un ebook COMPLETO y DESARROLLADO en español para:
Producto: ${data.product}, Publico: ${data.audience}, Problema: ${data.problem}, Transformacion: ${data.transformation}.
Incluye:
1. 3 titulos magneticos con subtitulo
2. Indice detallado con 7 capitulos
3. CAPITULO 1 completamente desarrollado (minimo 600 palabras con subtemas, ejemplos y ejercicios)
4. CAPITULO 2 completamente desarrollado (minimo 600 palabras)
5. CAPITULO 3 completamente desarrollado (minimo 500 palabras)
6. Conclusion con llamada a la accion poderosa (300 palabras)
Escribe de forma calida, profesional y motivadora. No uses listas cortas — desarrolla cada punto.`,

        bonos: `Eres experto en lanzamientos digitales. Crea 5 bonos irresistibles en español para:
Producto: ${data.product}, Publico: ${data.audience}, Precio: ${data.price}.
Para cada bono incluye: nombre creativo y atractivo, descripcion detallada de 3-4 lineas, valor percibido en USD, por que lo incluyes (justificacion emocional), y copy completo para presentarlo en la landing page.
Al final incluye una tabla resumen con el valor total acumulado vs el precio del producto.`,

        copies: `Eres copywriter experto en AIDA y persuasion. Crea en español para:
Producto: ${data.product}, Publico: ${data.audience}, Precio: ${data.price}.
Genera:
1. Secuencia de 5 emails de lanzamiento completos (asunto + cuerpo completo)
2. 5 posts de Instagram con caption largo, hashtags y CTA
3. 7 scripts de stories paso a paso
4. 3 anuncios completos para Facebook/Instagram Ads (headline + texto + CTA)
5. 2 mensajes de WhatsApp para difusion`,

        creativos: `Eres director creativo senior. Crea briefs detallados en español para:
Producto: ${data.product}, Publico: ${data.audience}.
Estetica: galaxy oscura, fucsia #ff006e, violeta #7c3aed, negro #05050a.
Genera:
1. Brief completo de portada de ebook (dimensiones, elementos, tipografia, composicion)
2. Brief de banner principal 1080x1080 y 1080x1920
3. Descripcion detallada de 6 slides de carrusel (tema, texto, visual, CTA)
4. Paleta de marca completa con codigos HEX, tipografias y patron de uso
5. 5 prompts detallados para Midjourney/DALL-E listos para copiar y usar`,

        trafico: `Eres experto en trafico digital y lanzamientos. Crea estrategia completa en español para:
Producto: ${data.product}, Publico: ${data.audience}, Precio: ${data.price}, Presupuesto: ${data.budget || 'no especificado'}.
Incluye:
1. Plan de contenido organico 30 dias (calendario semana a semana con temas y formatos)
2. Estrategia de Facebook/Instagram Ads (estructura de campana, segmentacion detallada, copy de anuncios, presupuesto sugerido)
3. Funnel de ventas completo (trafico frio > lead magnet > secuencia email > oferta > upsell)
4. Cronograma de lanzamiento dia a dia las ultimas 2 semanas
5. KPIs clave y metricas de exito esperadas`,
      };

      prompt = prompts[step] || `Genera contenido profesional en español para el producto: ${data.product}, publico: ${data.audience}. Modulo: ${step}. Se extenso y detallado.`;
    }

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: step === 'landing' ? 8000 : 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const json = await r.json();
    const text = json?.content?.[0]?.text || 'Error al generar contenido';
    return res.status(200).json({ content: text, step });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
