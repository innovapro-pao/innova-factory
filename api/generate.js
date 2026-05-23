export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { step, data } = req.body;
    const key = process.env.ANTHROPIC_API_KEY;

    const prompt = `Eres un experto en marketing digital. Genera contenido profesional en español para: Producto: ${data.product || ''}, Publico: ${data.audience || ''}, Problema: ${data.problem || ''}, Transformacion: ${data.transformation || ''}, Precio: ${data.price || ''}. Modulo solicitado: ${step}. Genera contenido extenso y completo.`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const json = await r.json();
    const text = json?.content?.[0]?.text || JSON.stringify(json);
    return res.status(200).json({ content: text, step });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
