

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { step, data } = req.body;

    const prompts = {
      ebook: `Crea un ebook completo para: Producto: ${data.product}, Público: ${data.audience}, Problema: ${data.problem}, Transformación: ${data.transformation}. Incluí título, índice y 3 capítulos completos.`,
      bonos: `Crea 4 bonos irresistibles para: ${data.product}. Público: ${data.audience}. Incluí nombre, descripción y valor de cada bono.`,
      landing: `Crea una landing page HTML completa para: ${data.product}. Público: ${data.audience}. Precio: ${data.price}. Colores: negro, fucsia #ff006e, violeta #7c3aed.`,
      copies: `Crea copies AIDA completos para: ${data.product}. Público: ${data.audience}. Incluí 5 emails, 5 posts Instagram, stories y ads.`,
      creativos: `Crea briefs de creativos y prompts para Midjourney para: ${data.product}. Estética galaxy oscura, fucsia, violeta.`,
      trafico: `Crea estrategia de tráfico completa para: ${data.product}. Precio: ${data.price}. Incluí plan orgánico, paid y cronograma 30 días.`,
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompts[step] }],
      }),
    });

    const result = await response.json();
    const content = result?.content?.[0]?.text || result?.completion || JSON.stringify(result);
    res.status(200).json({ content, step });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
