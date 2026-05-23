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
      const lc = landingConfig;
      const badges = [lc.badge1, lc.badge2, lc.badge3].filter(Boolean);
      const urgency = lc.urgency || [];

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

Devuelve EXACTAMENTE este JSON completo:
{
  "preheadline": "frase corta llamativa tipo ATENCIÓN para el público específico",
  "headline1": "primera línea del título en mayúsculas máximo 6 palabras",
  "headline2": "segunda línea del título con la promesa clave máximo 6 palabras",
  "headline_sub": "frase en cursiva dentro de un recuadro como en todoketo: poética y directa",
  "marquee_items": ["frase corta 1","frase corta 2","frase corta 3","frase corta 4"],
  "para_vos_si": [
    {"icon":"🎯","title":"Si querés X","desc":"pero Y, Z. Frase en color acento."},
    {"icon":"💡","title":"Si querés X","desc":"pero Y, Z. Frase en color acento."},
    {"icon":"⚡","title":"Si querés X","desc":"pero Y, Z. Frase en color acento."},
    {"icon":"🏆","title":"Si querés X","desc":"pero Y, Z. Frase en color acento."},
    {"icon":"🎨","title":"Si querés X","desc":"pero Y, Z. Frase en color acento."},
    {"icon":"🚀","title":"Si querés X","desc":"pero Y, Z. Frase en color acento."}
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
  "logros_frase": "frase remate poderosa de cierre para la sección de logros, máximo 10 palabras",
  "trust_badges": [
    {"icon":"🔒","label":"Compra 100% segura"},
    {"icon":"⚡","label":"Acceso inmediato"},
    {"icon":"⭐","label":"Calidad premium"},
    {"icon":"📄","label":"Sin letras chicas"},
    {"icon":"⏰","label":"Por tiempo limitado"}
  ],
  "testimonials": [
    {"name":"Nombre Apellido","place":"Ciudad, País","result":"Resultado concreto obtenido","text":"Testimonio de 2 oraciones muy persuasivo y real","stars":5},
    {"name":"Nombre Apellido","place":"Ciudad, País","result":"Resultado concreto obtenido","text":"Testimonio de 2 oraciones muy persuasivo y real","stars":5},
    {"name":"Nombre Apellido","place":"Ciudad, País","result":"Resultado concreto obtenido","text":"Testimonio de 2 oraciones muy persuasivo y real","stars":5}
  ],
  "faq": [
    {"q":"¿Cómo recibo el producto después de pagar?","a":"Respuesta clara y tranquilizadora"},
    {"q":"Pregunta frecuente relevante 2","a":"Respuesta clara y tranquilizadora"},
    {"q":"Pregunta frecuente relevante 3","a":"Respuesta clara y tranquilizadora"},
    {"q":"Pregunta frecuente relevante 4","a":"Respuesta clara y tranquilizadora"},
    {"q":"Pregunta frecuente relevante 5","a":"Respuesta clara y tranquilizadora"}
  ],
  "guarantee_text": "texto persuasivo para la sección de garantía de ${lc.guarantee} días",
  "final_headline": "título final de cierre poderoso máximo 8 palabras",
  "stock_text": "Solo quedan ${lc.stockLeft || '12'} lugares disponibles",
  "sold_pct": ${lc.soldPct || 73},
  "popup_actions": [
    "acaba de descargar el producto",
    "activó su acceso ahora mismo",
    "descargó los bonos del pack",
    "ya tiene su acceso listo"
  ]
}`;

    } else {
      const prompts = {
        ebook: `Eres experto en infoproductos. Crea un ebook COMPLETO en español para:
Producto: ${data.product}, Publico: ${data.audience}, Problema: ${data.problem}, Transformacion: ${data.transformation}.
Incluye: 3 titulos magneticos, indice con 7 capitulos, CAPITULO 1 desarrollado (600 palabras), CAPITULO 2 desarrollado (600 palabras), CAPITULO 3 desarrollado (500 palabras), conclusion con CTA (300 palabras).`,

        bonos: `Eres experto en lanzamientos. Crea exactamente 4 bonos irresistibles en español para:
Producto: ${data.product}, Publico: ${data.audience}, Precio: ${data.price}.
Devuelve SOLO JSON puro sin markdown ni explicaciones:
{
  "bonos": [
    {"nombre":"NOMBRE DEL BONO EN MAYUSCULAS","descripcion":"descripción 2-3 líneas del valor que aporta","precio_original":"USD 27","emoji":"🎯"},
    {"nombre":"NOMBRE DEL BONO EN MAYUSCULAS","descripcion":"descripción 2-3 líneas del valor que aporta","precio_original":"USD 37","emoji":"📋"},
    {"nombre":"NOMBRE DEL BONO EN MAYUSCULAS","descripcion":"descripción 2-3 líneas del valor que aporta","precio_original":"USD 47","emoji":"⚡"},
    {"nombre":"NOMBRE DEL BONO EN MAYUSCULAS","descripcion":"descripción 2-3 líneas del valor que aporta","precio_original":"USD 27","emoji":"🏆"}
  ],
  "valor_total": "USD 138",
  "frase_remate": "frase poderosa de cierre para los bonos máximo 10 palabras"
}`,

        copies: `Eres copywriter AIDA experto. Genera en español para: Producto: ${data.product}, Publico: ${data.audience}, Precio: ${data.price}.
1. Secuencia 5 emails lanzamiento completos (asunto + cuerpo)
2. 5 posts Instagram con caption largo, hashtags y CTA
3. 7 scripts de stories paso a paso
4. 3 anuncios Facebook/Instagram Ads completos
5. 2 mensajes WhatsApp difusion`,

        creativos: `Eres director creativo senior. Crea briefs detallados para: Producto: ${data.product}, Estetica: negro premium, colores del usuario.
1. Brief portada ebook completo
2. Brief banner 1080x1080 y 1080x1920
3. Descripcion 6 slides carrusel
4. Paleta de marca completa HEX + tipografias
5. 5 prompts Midjourney/DALL-E listos para copiar`,

        trafico: `Eres experto en trafico digital. Estrategia completa para: Producto: ${data.product}, Publico: ${data.audience}, Precio: ${data.price}.
1. Plan organico 30 dias (calendario semanal)
2. Estrategia Facebook/Instagram Ads (estructura, segmentacion, copy, presupuesto)
3. Funnel ventas completo
4. Cronograma lanzamiento dia a dia ultimas 2 semanas
5. KPIs y metricas de exito`,
      };
      prompt = prompts[step] || `Genera contenido profesional en español para: ${data.product}, publico: ${data.audience}. Modulo: ${step}. Se extenso y detallado.`;
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

    if (step === 'landing' && landingConfig) {
      try {
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const content = JSON.parse(text);
        const html = buildPremiumLanding(landingConfig, data, content);
        return res.status(200).json({ content: html, step, isHtml: true });
      } catch(e) {
        return res.status(200).json({ content: text, step, isHtml: false });
      }
    }

    return res.status(200).json({ content: text, step });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function buildPremiumLanding(lc, data, c) {
  const c1  = lc.color1  || '#D4AF37';
  const c2  = lc.color2  || '#1a5c3a';
  const bg  = lc.colorBg || '#000000';
  const cta = lc.cta     || '¡Quiero empezar ahora!';
  const url = lc.url     || '#';
  const guarantee = lc.guarantee || 30;
  const urgency = lc.urgency || [];
  const hasCountdown = urgency.includes('countdown');
  const hasSold = urgency.includes('sold');
  const hasStock = urgency.includes('stock') || urgency.includes('limited');
  const hasViewers = urgency.includes('viewers');
  const badges = [lc.badge1, lc.badge2, lc.badge3].filter(Boolean);
  const bonos = data.bonos || [];
  const heroImages = lc.heroImages || [];

  const marqueeItems = (c.marquee_items || ['PRODUCTO PREMIUM','ACCESO INMEDIATO','RESULTADOS REALES','TRANSFORMACIÓN GARANTIZADA']);
  const marqueeHTML = [...marqueeItems, ...marqueeItems].map(i =>
    `<div class="tk-item">⬡&nbsp;&nbsp;${i}&nbsp;&nbsp;</div>`).join('');

  const paraVosHTML = (c.para_vos_si || []).map(i => `
    <div class="pv-item">
      <div class="pv-icon">${i.icon}</div>
      <div class="pv-body">
        <div class="pv-title-item">${i.title}</div>
        <div class="pv-desc">${i.desc}</div>
      </div>
    </div>`).join('');

  const aprendHTML = (c.que_vas_aprender || []).map(i => `
    <div class="learn-item">
      <div class="learn-check">✓</div>
      <div class="learn-body">
        <div class="learn-title-item">${i.title}</div>
        <div class="learn-desc">${i.desc}</div>
      </div>
    </div>`).join('');

  const logrosHTML = (c.logros || []).map(l => `
    <div class="logro-item">
      <div class="logro-icon">${l.icon}</div>
      <div class="logro-body">
        <div class="logro-titulo">${l.titulo}</div>
        <div class="logro-desc">${l.desc}</div>
      </div>
    </div>`).join('');

  const bonosHTML = bonos.map((b, i) => `
    <div class="bono-card">
      <div class="bono-mockup">
        ${lc.bonoImages && lc.bonoImages[i]
          ? `<img src="${lc.bonoImages[i]}" alt="${b.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`
          : `<div class="bono-mockup-inner"><div class="bono-emoji">${b.emoji||'🎁'}</div><div class="bono-mock-title">${b.nombre}</div></div>`
        }
      </div>
      <div class="bono-num">BONO ${i+1}</div>
      <div class="bono-nombre">${b.nombre}</div>
      <div class="bono-desc">${b.descripcion}</div>
      <div class="bono-precio-old"><s>${b.precio_original}</s></div>
      <div class="bono-gratis">HOY GRATIS</div>
    </div>`).join('');

  const heroCarouselHTML = heroImages.length >= 2
    ? heroImages.map((img, i) => `<div class="hero-slide ${i===0?'active':''}" style="background-image:url('${img}')"></div>`).join('')
    : `<div class="hero-slide active" style="background:radial-gradient(ellipse 100% 80% at 50% 0%,rgba(212,175,55,.15),transparent 60%)"></div>`;

  const trustHTML = (c.trust_badges || []).map(b => `
    <div class="trust-item">
      <div class="trust-icon">${b.icon}</div>
      <div class="trust-label">${b.label}</div>
    </div>`).join('');

  const testiHTML = (c.testimonials || []).map(t => `
    <div class="testi-card">
      <div class="testi-stars">${'⭐'.repeat(t.stars||5)}</div>
      <div class="testi-text">"${t.text}"</div>
      <div class="testi-author">
        <div class="testi-avatar">${t.name.charAt(0)}</div>
        <div>
          <div class="testi-name">${t.name}</div>
          <div class="testi-place">${t.place}</div>
          <div class="testi-result">✓ ${t.result}</div>
        </div>
      </div>
    </div>`).join('');

  const faqHTML = (c.faq || []).map((f, i) => `
    <div class="faq-item" aria-expanded="false">
      <button class="faq-q" onclick="toggleFaq(this)">
        <span class="faq-left"><span class="faq-num">${String(i+1).padStart(2,'0')}</span><span class="faq-qt">${f.q}</span></span>
        <span class="faq-ico">+</span>
      </button>
      <div class="faq-a"><div class="faq-ai">${f.a}</div></div>
    </div>`).join('');

  const popupActionsJS = (c.popup_actions || ['acaba de comprar','descargó los bonos','activó su acceso']).map(a => `"${a}"`).join(',');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.product}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Poppins:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>
:root{--c1:${c1};--c2:${c2};--bg:${bg};--text:#f2f2f2;--muted:#cfcfcf;--card:rgba(255,255,255,0.04)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Montserrat',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;line-height:1.6}
.container{max-width:860px;margin:0 auto;padding:0 20px}
.gold{background:linear-gradient(90deg,#fff4b0,var(--c1),#ffb300,#fff8c0,var(--c1),#fff4b0);background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:goldFlow 4s linear infinite;filter:drop-shadow(0 0 8px rgba(212,175,55,.5))}
@keyframes goldFlow{0%{background-position:0%}100%{background-position:300%}}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:18px 40px;background:var(--c2);color:#fff;border:none;border-radius:999px;font-family:'Montserrat',sans-serif;font-size:1rem;font-weight:800;cursor:pointer;text-decoration:none;letter-spacing:1px;text-transform:uppercase;transition:all .3s;width:100%;max-width:360px}
.btn:hover{transform:scale(1.03);filter:brightness(1.1)}

/* TOP BAR */
.top-bar{background:linear-gradient(90deg,var(--c2),var(--c1),var(--c2));padding:10px 16px;text-align:center;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;position:sticky;top:0;z-index:200;animation:barFlash 2.5s ease-in-out infinite}
@keyframes barFlash{0%,100%{opacity:1}50%{opacity:.8}}
.top-bar-inner{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
.top-badge{background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:4px 12px;font-size:11px;display:flex;align-items:center;gap:6px}
.top-dot{width:7px;height:7px;border-radius:50%;background:#fff;animation:dotPulse 1s infinite}
@keyframes dotPulse{0%,100%{opacity:1}50%{opacity:.3}}
.viewers-badge{background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:4px 12px;font-size:11px;display:flex;align-items:center;gap:6px}
.viewers-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;animation:dotPulse 1.5s infinite}

/* HERO CAROUSEL */
.hero{position:relative;min-height:600px;display:flex;align-items:center;overflow:hidden}
.hero-slides{position:absolute;inset:0;z-index:0}
.hero-slide{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1.2s ease;background-color:var(--bg)}
.hero-slide.active{opacity:1}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.3) 50%,rgba(0,0,0,.7) 100%);z-index:1}
.hero-content{position:relative;z-index:2;width:100%;padding:80px 20px 60px;text-align:center}
.hero-preheadline{display:inline-block;font-size:12px;font-weight:700;letter-spacing:5px;text-transform:uppercase;color:var(--text);margin-bottom:24px;opacity:.9}
.hero-h1{font-size:clamp(2.2rem,9vw,4.5rem);font-weight:900;text-transform:uppercase;line-height:1.05;margin-bottom:8px}
.hero-sub-box{border:1px solid rgba(212,175,55,.4);border-radius:10px;padding:16px 28px;display:inline-block;margin:20px auto;max-width:520px}
.hero-sub-text{font-size:16px;font-style:italic;font-weight:500;color:#e8e8e8;line-height:1.5}
.hero-badges{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:24px auto;max-width:500px}
.hero-badge-item{background:rgba(255,255,255,.05);border:1px solid rgba(212,175,55,.2);padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;animation:floatBadge 3s ease-in-out infinite}
@keyframes floatBadge{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.hero-cta-wrap{margin-top:32px;display:flex;flex-direction:column;align-items:center;gap:12px}
.hero-proof{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px}
.live-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;animation:dotPulse 1.5s infinite}
.hero-dots{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:3}
.hero-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.3);border:none;cursor:pointer;transition:all .3s;padding:0}
.hero-dot.active{background:var(--c1);width:24px;border-radius:4px}

/* MARQUEE */
.marquee-wrap{background:var(--bg);border-top:2px solid var(--c1);border-bottom:2px solid var(--c1);padding:14px 0;overflow:hidden}
.marquee-track{display:flex;width:max-content;animation:marqueeScroll 20s linear infinite}
.tk-item{display:inline-flex;align-items:center;padding:0 32px;white-space:nowrap;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-size:15px;color:var(--c1)}
@keyframes marqueeScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

/* MOCKUP SECTION */
.mockup-section{padding:60px 20px;text-align:center;background:linear-gradient(180deg,var(--bg),rgba(212,175,55,.03))}
.mockup-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:32px;max-width:760px;margin-left:auto;margin-right:auto;align-items:start}
@media(max-width:600px){.mockup-grid{grid-template-columns:1fr}}
.mockup-img{width:100%;border-radius:16px;overflow:hidden}
.mockup-img img{width:100%;height:auto;display:block;border-radius:16px}

/* LOGROS */
.logros-panel{background:#0a0a0a;border-radius:16px;padding:28px;position:relative;overflow:hidden}
.logros-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--c1),#ffb300,var(--c1))}
.logros-eyebrow{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:var(--c1);margin-bottom:6px;text-align:center}
.logros-titulo{font-size:1.3rem;font-weight:900;color:#fff;text-align:center;margin-bottom:4px}
.logros-titulo span{color:var(--c1)}
.logros-sub{font-size:.78rem;color:#888;text-align:center;margin-bottom:20px}
.logros-divider{width:50px;height:2px;background:linear-gradient(90deg,transparent,var(--c1),transparent);margin:0 auto 20px}
.logro-item{display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;padding:14px;background:#141414;border-radius:10px;border:1px solid #222}
.logro-icon{width:40px;height:40px;border-radius:50%;background:#1a1500;border:1.5px solid var(--c1);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px}
.logro-titulo{font-size:.82rem;font-weight:700;color:var(--c1);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.logro-desc{font-size:.75rem;color:#aaa;line-height:1.5}
.logros-frase{margin-top:16px;padding:14px;background:#0f0f00;border:1px solid rgba(212,175,55,.2);border-radius:10px;text-align:center;font-size:.88rem;color:var(--c1);font-weight:600;font-style:italic}

/* PARA VOS SI */
.pv-section{padding:60px 20px;background:linear-gradient(180deg,rgba(212,175,55,.03),var(--bg))}
.pv-eyebrow{font-size:11px;letter-spacing:5px;text-transform:uppercase;color:var(--c1);text-align:center;margin-bottom:12px;opacity:.8}
.pv-title{font-size:clamp(1.8rem,6vw,2.8rem);font-weight:900;text-align:center;margin-bottom:32px}
.pv-list{display:flex;flex-direction:column;gap:16px;max-width:680px;margin:0 auto 40px}
.pv-item{display:flex;align-items:flex-start;gap:16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:18px 20px}
.pv-icon{font-size:1.8rem;flex-shrink:0;margin-top:2px}
.pv-title-item{font-size:.95rem;font-weight:700;color:#fff;margin-bottom:4px}
.pv-desc{font-size:.88rem;color:var(--muted);line-height:1.6}

/* LEARN */
.learn-section{padding:60px 20px;background:rgba(0,0,0,.2)}
.learn-eyebrow{text-align:center;font-size:11px;letter-spacing:5px;text-transform:uppercase;color:var(--c1);margin-bottom:8px;opacity:.8}
.learn-title{text-align:center;font-size:clamp(1.8rem,6vw,2.8rem);font-weight:900;margin-bottom:32px}
.learn-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:700px;margin:0 auto 32px}
@media(max-width:600px){.learn-grid{grid-template-columns:1fr}}
.learn-item{display:flex;align-items:flex-start;gap:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:12px;padding:16px}
.learn-check{width:28px;height:28px;border-radius:50%;background:var(--c2);display:grid;place-items:center;font-size:.8rem;font-weight:800;color:#fff;flex-shrink:0;margin-top:2px}
.learn-title-item{font-size:.82rem;font-weight:800;color:var(--c1);letter-spacing:1px;margin-bottom:4px}
.learn-desc{font-size:.8rem;color:var(--muted);line-height:1.5}

/* BONOS */
.bonus-section{padding:60px 20px;background:rgba(0,0,0,.15)}
.bonus-eyebrow{text-align:center;font-size:11px;letter-spacing:5px;text-transform:uppercase;color:var(--c1);margin-bottom:8px;opacity:.8}
.bonus-title{text-align:center;font-size:clamp(1.5rem,5vw,2.2rem);font-weight:900;margin-bottom:8px}
.bonus-sub{text-align:center;color:var(--muted);font-size:.9rem;margin-bottom:32px}
.bonos-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;max-width:900px;margin:0 auto 32px}
.bono-card{background:linear-gradient(135deg,rgba(212,175,55,.08),rgba(212,175,55,.03));border:1px solid rgba(212,175,55,.2);border-radius:16px;padding:20px;text-align:center;transition:all .25s}
.bono-card:hover{border-color:var(--c1);transform:translateY(-4px)}
.bono-mockup{width:100%;aspect-ratio:1;border-radius:12px;overflow:hidden;margin-bottom:12px;background:#111;display:flex;align-items:center;justify-content:center}
.bono-mockup-inner{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px}
.bono-emoji{font-size:2.5rem}
.bono-mock-title{font-size:.7rem;font-weight:800;color:var(--c1);text-transform:uppercase;letter-spacing:1px;text-align:center;line-height:1.3}
.bono-num{font-size:.7rem;font-weight:800;color:var(--c1);letter-spacing:3px;text-transform:uppercase;margin-bottom:6px}
.bono-nombre{font-size:.85rem;font-weight:800;color:#fff;margin-bottom:6px;line-height:1.3}
.bono-desc{font-size:.75rem;color:var(--muted);line-height:1.5;margin-bottom:10px}
.bono-precio-old{font-size:.82rem;color:#666;text-decoration:line-through;margin-bottom:4px}
.bono-gratis{font-size:.9rem;font-weight:900;color:#22c55e;letter-spacing:2px;text-transform:uppercase}

/* COUNTDOWN */
.countdown-section{padding:40px 20px;text-align:center;max-width:520px;margin:0 auto}
.cd-wrap{background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.3)}
.cd-header{background:var(--c2);padding:20px 24px;text-align:center}
.cd-header-label{font-size:11px;letter-spacing:5px;text-transform:uppercase;color:rgba(212,175,55,.8);margin-bottom:6px}
.cd-header-title{font-size:20px;font-weight:800;color:#fff}
.cd-header-title span{color:var(--c1)}
.cd-body{padding:28px 24px;background:#fffdf8;text-align:center}
.cd-desc{font-size:14px;color:#666;line-height:1.65;margin-bottom:20px}
.cd-desc strong{color:var(--c2)}
.cd-label{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#bbb;margin-bottom:12px}
.cd-timer{display:flex;justify-content:center;align-items:center;gap:10px;margin-bottom:8px}
.cd-unit{display:flex;flex-direction:column;align-items:center;gap:5px}
.cd-digit{background:#fdf6e8;border:1.5px solid #e8dfc8;border-radius:12px;width:76px;height:76px;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:800;color:#1a1a1a;font-variant-numeric:tabular-nums}
.cd-unit-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#bbb}
.cd-sep{font-size:36px;font-weight:800;color:var(--c1);margin-bottom:18px;line-height:1}
.cd-btn{display:block;background:var(--c2);color:#fff;font-size:14px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:16px 36px;border-radius:999px;border:none;cursor:pointer;width:100%;max-width:300px;margin:0 auto;text-decoration:none}
.cd-sub{margin-top:10px;font-size:11px;color:#bbb;letter-spacing:1px}

/* SOLD BAR */
.sold-section{padding:32px 20px;text-align:center}
.sold-wrap{max-width:560px;margin:0 auto}
.sold-label{font-size:.95rem;margin-bottom:10px;font-weight:600}
.sold-label strong{color:var(--c1)}
.sold-bar{height:16px;background:rgba(255,255,255,.08);border-radius:100px;overflow:hidden}
.sold-fill{height:100%;background:linear-gradient(90deg,var(--c2),var(--c1));border-radius:100px;animation:fillBar 2.5s ease forwards}
@keyframes fillBar{from{width:0}}
.sold-warning{margin-top:10px;font-size:.82rem;color:var(--c1);font-weight:700;animation:warnBlink 1.5s infinite}
@keyframes warnBlink{0%,100%{opacity:1}50%{opacity:.5}}

/* STOCK */
.stock-alert{display:inline-flex;align-items:center;gap:8px;background:rgba(255,0,0,.08);border:1px solid rgba(255,0,0,.2);padding:10px 20px;border-radius:12px;font-size:.88rem;font-weight:600;margin:16px auto;color:#ff6b6b}
.stock-pulse{width:9px;height:9px;border-radius:50%;background:#ff6b6b;animation:dotPulse 1s infinite;flex-shrink:0}

/* TRUST */
.trust-section{padding:28px 20px;border-top:1px solid rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.05)}
.trust-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;max-width:700px;margin:0 auto}
.trust-item{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:100px;text-align:center}
.trust-icon{font-size:1.5rem}
.trust-label{font-size:.7rem;color:var(--muted);font-weight:600;letter-spacing:1px;text-transform:uppercase}

/* TESTIMONIALS */
.testi-section{padding:60px 20px;background:rgba(0,0,0,.1)}
.testi-eyebrow{text-align:center;font-size:11px;letter-spacing:5px;text-transform:uppercase;color:var(--c1);margin-bottom:8px;opacity:.8}
.testi-title{text-align:center;font-size:clamp(1.5rem,5vw,2.2rem);font-weight:900;margin-bottom:32px}
.testi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;max-width:900px;margin:0 auto 32px}
.testi-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:24px;transition:all .25s}
.testi-card:hover{border-color:rgba(212,175,55,.3);transform:translateY(-4px)}
.testi-stars{font-size:.9rem;margin-bottom:10px}
.testi-text{font-size:.88rem;color:var(--text);line-height:1.7;font-style:italic;margin-bottom:16px}
.testi-author{display:flex;align-items:center;gap:10px}
.testi-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--c1),var(--c2));display:grid;place-items:center;font-weight:900;font-size:.9rem;color:#fff;flex-shrink:0}
.testi-name{font-size:.85rem;font-weight:700;color:#fff}
.testi-place{font-size:.75rem;color:var(--muted)}
.testi-result{font-size:.75rem;color:var(--c1);font-weight:600;margin-top:2px}

/* PRICE */
.price-section{padding:60px 20px;text-align:center;background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(212,175,55,.03))}
.price-eyebrow{font-size:11px;letter-spacing:5px;text-transform:uppercase;color:var(--c1);margin-bottom:8px;opacity:.8}
.price-title{font-size:clamp(1.5rem,5vw,2.2rem);font-weight:900;margin-bottom:32px}
.price-box{max-width:500px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 12px 50px rgba(0,0,0,.4)}
.price-box-header{background:var(--c2);padding:20px 24px;text-align:center}
.price-box-label{font-size:11px;letter-spacing:5px;text-transform:uppercase;color:rgba(212,175,55,.8);margin-bottom:6px}
.price-box-title{font-size:18px;font-weight:800;color:#fff}
.price-box-title span{color:var(--c1)}
.price-box-body{padding:28px 24px;background:#fffdf8;text-align:center}
.price-old{font-size:1.2rem;color:#bbb;text-decoration:line-through;margin-bottom:4px}
.price-current{font-size:4rem;font-weight:900;color:#1a1a1a;line-height:1;margin-bottom:4px}
.price-installments{font-size:.9rem;color:#666;margin-bottom:24px}
.price-btn{display:block;background:var(--c2);color:#fff;font-size:15px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:18px 36px;border-radius:999px;border:none;cursor:pointer;width:100%;max-width:320px;margin:0 auto 16px;text-decoration:none;transition:all .25s}
.price-btn:hover{filter:brightness(1.1);transform:scale(1.02)}
.price-guarantee{font-size:.8rem;color:#888;display:flex;align-items:center;justify-content:center;gap:6px}
.price-includes{text-align:left;margin-top:20px;padding-top:20px;border-top:1px solid #f0ece3}
.price-inc-label{font-size:.75rem;color:#999;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px}
.price-inc-item{display:flex;align-items:center;gap:8px;font-size:.85rem;color:#444;padding:.3rem 0}
.price-inc-item::before{content:'✓';color:var(--c2);font-weight:700}

/* GUARANTEE */
.guarantee-section{padding:48px 20px;text-align:center;background:rgba(212,175,55,.03);border-top:1px solid rgba(212,175,55,.1);border-bottom:1px solid rgba(212,175,55,.1)}
.guarantee-icon{font-size:3.5rem;margin-bottom:12px}
.guarantee-title{font-size:1.8rem;font-weight:900;margin-bottom:12px}
.guarantee-text{color:var(--muted);font-size:.95rem;line-height:1.8;max-width:520px;margin:0 auto}

/* FAQ */
.faq-section{padding:60px 20px;background:rgba(0,0,0,.05)}
.faq-eyebrow{display:inline-block;font-size:11px;letter-spacing:5px;text-transform:uppercase;color:var(--c2);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:5px 16px;margin-bottom:12px}
.faq-title{text-align:center;font-size:clamp(1.5rem,5vw,2rem);font-weight:800;margin-bottom:8px}
.faq-title span{color:var(--c1)}
.faq-sub{text-align:center;color:var(--muted);font-size:.88rem;margin-bottom:32px}
.faq-card{max-width:800px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,.2)}
.faq-item{border-bottom:1px solid #f0ece3}
.faq-item:last-child{border-bottom:none}
.faq-q{width:100%;text-align:left;background:transparent;border:0;cursor:pointer;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px;transition:background .18s}
.faq-q:hover{background:#faf8f3}
.faq-left{display:flex;align-items:center;gap:12px}
.faq-num{width:28px;height:28px;border-radius:8px;background:var(--c2);color:#fff;font-weight:800;font-size:12px;display:grid;place-items:center;flex-shrink:0}
.faq-qt{font-size:.9rem;font-weight:700;color:#1a1a1a;text-align:left;line-height:1.4}
.faq-ico{width:30px;height:30px;border-radius:50%;border:1.5px solid var(--c1);display:grid;place-items:center;color:#b8952a;font-size:18px;font-weight:300;flex-shrink:0;transition:transform .22s,background .18s;background:#fffdf7}
.faq-item[aria-expanded="true"] .faq-ico{transform:rotate(45deg);background:#fef9ec}
.faq-item[aria-expanded="true"] .faq-num{background:var(--c1)}
.faq-a{max-height:0;overflow:hidden;transition:max-height .3s ease}
.faq-ai{padding:0 20px 16px 60px;font-size:.88rem;color:#444;line-height:1.65}
.faq-foot{padding:14px 20px;text-align:center;font-size:.8rem;color:#888;background:#faf8f3;border-top:1px solid #f0ece3}
.faq-foot b{color:var(--c2)}

/* FINAL */
.final-section{padding:80px 20px;text-align:center;background:linear-gradient(180deg,var(--bg),rgba(212,175,55,.04))}
.final-title{font-size:clamp(1.8rem,6vw,3rem);font-weight:900;margin-bottom:12px}
.final-sub{color:var(--muted);font-size:1rem;margin-bottom:32px;max-width:520px;margin-left:auto;margin-right:auto}
.final-cta-wrap{display:flex;flex-direction:column;align-items:center;gap:12px}

footer{background:rgba(0,0,0,.3);border-top:1px solid rgba(255,255,255,.05);padding:24px 20px;text-align:center;color:var(--muted);font-size:.78rem}

/* POPUP FOMO */
.tk-fomo{position:fixed;right:18px;bottom:18px;z-index:999999;width:min(370px,calc(100vw - 36px));display:none;opacity:0;transform:translateY(18px);transition:.35s ease;font-family:'Montserrat',sans-serif}
.tk-fomo.show{display:block;opacity:1;transform:translateY(0)}
.tk-card{background:linear-gradient(180deg,#060707,#000);border:1px solid rgba(212,175,55,.28);border-radius:16px;padding:12px;display:flex;gap:12px;align-items:center;box-shadow:0 18px 46px rgba(0,0,0,.55)}
.tk-avatar{width:50px;height:50px;border-radius:50%;overflow:hidden;flex:0 0 auto;border:2px solid rgba(15,61,46,.95);background:#111;position:relative}
.tk-avatar img{width:100%;height:100%;object-fit:cover;display:block}
.tk-avatar::after{content:'';position:absolute;right:2px;bottom:2px;width:11px;height:11px;border-radius:99px;background:#22c55e;border:2px solid #000}
.tk-content{flex:1;min-width:0}
.tk-title{color:#f2f2f2;font-size:13px;font-weight:800;line-height:1.25}
.tk-title b{color:var(--c1)}
.tk-sub{margin-top:5px;color:#cfcfcf;font-size:11.5px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.tk-pill{padding:3px 8px;border-radius:999px;border:1px solid rgba(212,175,55,.22);background:rgba(0,0,0,.25);color:rgba(212,175,55,.95);font-weight:700;font-size:10px}
.tk-time{color:#bdbdbd;font-size:11px}
.tk-close{border:0;background:transparent;color:rgba(212,175,55,.95);cursor:pointer;font-size:20px;line-height:1;padding:0 6px}

@media(max-width:600px){
  .hero-h1{font-size:2rem}
  .testi-grid{grid-template-columns:1fr}
  .learn-grid{grid-template-columns:1fr}
  .bonos-grid{grid-template-columns:1fr 1fr}
}
</style>
</head>
<body>

<div class="top-bar">
  <div class="top-bar-inner">
    <span class="top-badge"><span class="top-dot"></span> El precio está por subir</span>
    ${hasViewers ? `<span class="viewers-badge"><span class="viewers-dot"></span><span id="viewers">27</span> viendo ahora</span>` : ''}
  </div>
</div>

<section class="hero">
  <div class="hero-slides" id="heroSlides">${heroCarouselHTML}</div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="container">
      <div class="hero-preheadline">${c.preheadline || data.audience}</div>
      <h1 class="hero-h1">
        <span class="gold">${c.headline1 || data.product.toUpperCase()}</span>
        <span style="display:block">${c.headline2 || ''}</span>
      </h1>
      ${c.headline_sub ? `<div class="hero-sub-box"><span class="hero-sub-text">${c.headline_sub}</span></div>` : ''}
      ${badges.length ? `<div class="hero-badges">${badges.map(b => `<div class="hero-badge-item">⚡ ${b}</div>`).join('')}</div>` : ''}
      <div class="hero-cta-wrap">
        <a href="${url}" class="btn">${cta}</a>
        <div class="hero-proof"><div class="live-dot"></div> <span id="viewers2">--</span> personas viendo esto ahora</div>
      </div>
    </div>
  </div>
  <div class="hero-dots" id="heroDots"></div>
</section>

<div class="marquee-wrap">
  <div class="marquee-track">${marqueeHTML}${marqueeHTML}</div>
</div>

<section class="mockup-section">
  <div class="container">
    <p style="font-size:11px;letter-spacing:5px;text-transform:uppercase;color:var(--c1);opacity:.8;margin-bottom:8px;text-align:center">Tu producto</p>
    <h2 style="font-size:clamp(1.5rem,5vw,2.2rem);font-weight:900;margin-bottom:8px;text-align:center">Conocé lo que recibís</h2>
    <div class="mockup-grid">
      <div class="mockup-img">
        ${lc.images && lc.images.mockup
          ? `<img src="${lc.images.mockup}" alt="Mockup">`
          : `<div style="background:rgba(255,255,255,.04);border:2px dashed rgba(212,175,55,.3);border-radius:16px;min-height:280px;display:flex;align-items:center;justify-content:center;color:rgba(212,175,55,.5);font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase">📦 Mockup</div>`
        }
      </div>
      <div class="logros-panel">
        <p class="logros-eyebrow">Con este producto vas a lograr</p>
        <h3 class="logros-titulo">Resultados <span>reales</span></h3>
        <p class="logros-sub">Lo que vas a lograr paso a paso</p>
        <div class="logros-divider"></div>
        ${logrosHTML}
        ${c.logros_frase ? `<div class="logros-frase">"${c.logros_frase}"</div>` : ''}
      </div>
    </div>
  </div>
</section>

<section class="pv-section">
  <div class="container">
    <p class="pv-eyebrow">¿Es para vos?</p>
    <h2 class="pv-title">ESTO ES PARA VOS SI...</h2>
    <div class="pv-list">${paraVosHTML}</div>
    <div style="text-align:center;margin-bottom:8px">
      <p style="font-weight:800;letter-spacing:2px;text-transform:uppercase;font-size:.85rem;opacity:.7;margin-bottom:16px">✦ ${lc.promise} ✦</p>
      <a href="${url}" class="btn">Sí, esto es para mí →</a>
    </div>
  </div>
</section>

<section class="learn-section">
  <div class="container">
    <p class="learn-eyebrow">Contenido incluido</p>
    <h2 class="learn-title">¿QUÉ VAS A <span class="gold">APRENDER?</span></h2>
    <div class="learn-grid">${aprendHTML}</div>
    <div style="text-align:center;margin-top:24px"><a href="${url}" class="btn">${cta}</a></div>
  </div>
</section>

${hasCountdown ? `
<section style="padding:40px 20px;background:rgba(0,0,0,.1)">
  <div class="countdown-section">
    <div class="cd-wrap">
      <div class="cd-header">
        <div class="cd-header-label">Oferta exclusiva</div>
        <div class="cd-header-title">Tu acceso está <span>reservado</span></div>
      </div>
      <div class="cd-body">
        <p class="cd-desc">Este precio especial expira en <strong>10 minutos</strong>.</p>
        <div class="cd-label">La oferta finaliza en</div>
        <div class="cd-timer">
          <div class="cd-unit"><div class="cd-digit" id="cd-min">10</div><div class="cd-unit-label">Minutos</div></div>
          <div class="cd-sep">:</div>
          <div class="cd-unit"><div class="cd-digit" id="cd-sec">00</div><div class="cd-unit-label">Segundos</div></div>
        </div>
        <a href="${url}" class="cd-btn">${cta}</a>
        <p class="cd-sub">Descarga inmediata · Pago seguro</p>
      </div>
    </div>
  </div>
</section>` : ''}

${hasSold ? `
<section class="sold-section">
  <div class="sold-wrap">
    <div class="sold-label">🔥 <strong>${c.sold_pct || 73}% vendido</strong> — ¡Quedan pocos lugares!</div>
    <div class="sold-bar"><div class="sold-fill" style="width:${c.sold_pct || 73}%"></div></div>
    <div class="sold-warning">⚠️ ${c.stock_text || 'Solo quedan 12 lugares disponibles'}</div>
  </div>
</section>` : ''}

${hasStock ? `
<div style="text-align:center;padding:8px 20px">
  <div class="stock-alert"><span class="stock-pulse"></span>${c.stock_text || 'Solo quedan 12 cupos disponibles'}</div>
</div>` : ''}

<section class="bonus-section">
  <div class="container">
    <p class="bonus-eyebrow">Con tu compra hoy te llevás</p>
    <h2 class="bonus-title">100% GRATIS <span class="gold">4 BONOS EXCLUSIVOS</span></h2>
    <p class="bonus-sub">Valorados en ${bonos.reduce ? bonos.map(b=>b.precio_original).join(' + ') : ''} — Hoy incluidos sin costo extra.</p>
    <div class="bonos-grid">${bonosHTML}</div>
    <div style="text-align:center;margin-top:32px"><a href="${url}" class="btn">${cta}</a></div>
  </div>
</section>

<section class="trust-section">
  <div class="trust-grid">${trustHTML}</div>
</section>

<section class="testi-section">
  <div class="container">
    <p class="testi-eyebrow">Resultados reales</p>
    <h2 class="testi-title">Lo que dicen nuestros clientes ❤️</h2>
    <div class="testi-grid">${testiHTML}</div>
  </div>
</section>

<section class="price-section">
  <div class="container">
    <p class="price-eyebrow">Invertí en tu transformación</p>
    <h2 class="price-title">Tu acceso está <span class="gold">esperándote</span></h2>
    <div class="price-box">
      <div class="price-box-header">
        <div class="price-box-label">Oferta especial hoy</div>
        <div class="price-box-title">Tu acceso está <span>reservado</span></div>
      </div>
      <div class="price-box-body">
        ${data.oldprice ? `<div class="price-old">${data.oldprice}</div>` : ''}
        <div class="price-current">${data.price}</div>
        ${data.cuotas ? `<div class="price-installments">${data.cuotas}</div>` : ''}
        <a href="${url}" class="price-btn">${cta}</a>
        <div class="price-guarantee">🛡️ ${c.guarantee_text || `Garantía de ${guarantee} días`}</div>
        <div class="price-includes">
          <div class="price-inc-label">Incluye</div>
          <div class="price-inc-item">${data.product} completo</div>
          ${bonos.map(b=>`<div class="price-inc-item">Bono: ${b.nombre}</div>`).join('')}
          <div class="price-inc-item">Acceso inmediato al descargar</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="guarantee-section">
  <div class="container" style="max-width:600px">
    <div class="guarantee-icon">🛡️</div>
    <h2 class="guarantee-title">Garantía de ${guarantee} días</h2>
    <p class="guarantee-text">${c.guarantee_text || `Si en ${guarantee} días no estás satisfecha con el producto, te devolvemos el 100% de tu dinero.`}</p>
  </div>
</section>

<section class="faq-section">
  <div class="container">
    <div style="text-align:center;margin-bottom:8px"><span class="faq-eyebrow">Antes de comprar</span></div>
    <h2 class="faq-title">Preguntas <span>frecuentes</span></h2>
    <p class="faq-sub">Todo lo que necesitás saber antes de acceder.</p>
    <div class="faq-card">
      ${faqHTML}
      <div class="faq-foot">¿Te quedó alguna duda? <b>Escribinos</b> y te ayudamos.</div>
    </div>
  </div>
</section>

<section class="final-section">
  <div class="container">
    <h2 class="final-title"><span class="gold">${c.final_headline || '¿Lista para transformar tu vida?'}</span></h2>
    <p class="final-sub">${lc.subpromise || lc.promise}</p>
    <div class="final-cta-wrap">
      <a href="${url}" class="btn">${cta}</a>
      <div style="font-size:.78rem;color:var(--muted)">Descarga inmediata · Pago seguro · Garantía ${guarantee} días</div>
    </div>
  </div>
</section>

<footer>
  <p>${data.product}</p>
  <p style="margin-top:.5rem">© 2025 · Todos los derechos reservados</p>
</footer>

<div class="tk-fomo" id="tkFomo">
  <div class="tk-card">
    <div class="tk-avatar"><img id="tkAvatar" src="" alt="Cliente"></div>
    <div class="tk-content">
      <div class="tk-title" id="tkTitle"></div>
      <div class="tk-sub">
        <span class="tk-pill" id="tkPlace"></span>
        <span class="tk-pill">Acceso digital inmediato</span>
        <span class="tk-time" id="tkWhen"></span>
      </div>
    </div>
    <button class="tk-close" onclick="document.getElementById('tkFomo').style.display='none'">×</button>
  </div>
</div>

<script>
function updateViewers(){var v=Math.floor(Math.random()*28)+14;var e1=document.getElementById('viewers');var e2=document.getElementById('viewers2');if(e1)e1.textContent=v;if(e2)e2.textContent=v;}
updateViewers();setInterval(updateViewers,5000);

// Hero carousel
var slides=document.querySelectorAll('.hero-slide');
var dotsWrap=document.getElementById('heroDots');
var cur=0;
if(slides.length>1){
  slides.forEach(function(_,i){var d=document.createElement('button');d.className='hero-dot'+(i===0?' active':'');d.onclick=function(){goSlide(i);};dotsWrap.appendChild(d);});
  setInterval(function(){goSlide((cur+1)%slides.length);},5000);
}
function goSlide(n){
  slides[cur].classList.remove('active');
  var dots=document.querySelectorAll('.hero-dot');
  if(dots[cur])dots[cur].classList.remove('active');
  cur=n;
  slides[cur].classList.add('active');
  if(dots[cur])dots[cur].classList.add('active');
}

${hasCountdown ? `
var total=600;
function tick(){var m=Math.floor(total/60),s=total%60;var me=document.getElementById('cd-min'),se=document.getElementById('cd-sec');if(me)me.textContent=('0'+m).slice(-2);if(se)se.textContent=('0'+s).slice(-2);if(total>0)total--;}
tick();setInterval(tick,1000);` : ''}

function toggleFaq(btn){var item=btn.closest('.faq-item');var panel=item.querySelector('.faq-a');var open=item.getAttribute('aria-expanded')==='true';document.querySelectorAll('.faq-item').forEach(function(i){i.setAttribute('aria-expanded','false');i.querySelector('.faq-a').style.maxHeight=0;});if(!open){item.setAttribute('aria-expanded','true');panel.style.maxHeight=panel.scrollHeight+'px';}}

var pops=[{name:"Luciana",place:"Buenos Aires 🇦🇷",img:"https://randomuser.me/api/portraits/women/44.jpg"},{name:"Marcos",place:"Rosario 🇦🇷",img:"https://randomuser.me/api/portraits/men/32.jpg"},{name:"Valentina",place:"Montevideo 🇺🇾",img:"https://randomuser.me/api/portraits/women/68.jpg"},{name:"Carlos",place:"Bogotá 🇨🇴",img:"https://randomuser.me/api/portraits/men/46.jpg"},{name:"Fernanda",place:"Ciudad de México 🇲🇽",img:"https://randomuser.me/api/portraits/women/29.jpg"},{name:"Diego",place:"Santiago 🇨🇱",img:"https://randomuser.me/api/portraits/men/55.jpg"},{name:"Camila",place:"Lima 🇵🇪",img:"https://randomuser.me/api/portraits/women/15.jpg"},{name:"Rodrigo",place:"Asunción 🇵🇾",img:"https://randomuser.me/api/portraits/men/22.jpg"}];
var actions=[${popupActionsJS}];
var times=["hace 1 min","hace 2 min","hace 3 min","hace 5 min","ahora mismo"];
var pi=0;
function showPopup(){var p=pops[pi%pops.length];pi++;var a=actions[Math.floor(Math.random()*actions.length)];var t=times[Math.floor(Math.random()*times.length)];var el=document.getElementById('tkFomo');document.getElementById('tkAvatar').src=p.img;document.getElementById('tkPlace').textContent=p.place;document.getElementById('tkWhen').textContent=t;document.getElementById('tkTitle').innerHTML='<b>'+p.name+'</b> de <b>'+p.place+'</b> '+a;el.classList.add('show');setTimeout(function(){el.classList.remove('show');},5000);}
setTimeout(showPopup,3500);setInterval(showPopup,14000);
</script>
</body>
</html>`;
}
