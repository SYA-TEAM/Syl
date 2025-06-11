import axios from 'axios';

const NIGHT_API_ENDPOINTS = [
  'https://nightapioficial.onrender.com',
  'https://nightapi-2a6l.onrender.com',
  'https://nightapi.is-a.dev'
];

const API_PATH = (prompt) => `/api/maycode/models/v2/?message=${encodeURIComponent(prompt)}`;

async function fetchMayCode(prompt) {
  for (const base of NIGHT_API_ENDPOINTS) {
    try {
      const res = await axios.get(base + API_PATH(prompt));
      if (res.data?.code || res.data?.MayCode) return res.data;
    } catch (err) {
      console.warn(`[Error] ${base} → ${err.message}`);
    }
  }
  throw new Error('Todas las instancias están fuera de servicio.');
}

const handler = async (m, { conn, text }) => {
  if (!text) {
    return conn.reply(m.chat, 
`⚠️ *Uso correcto de MayCode:*

.maycode [tu pregunta o solicitud de código]

📌 Ejemplo:
.maycode ¿Cómo creo un input con bordes redondeados en HTML?

🔧 Modelo: MayCode v2`, m);
  }

  await conn.reply(m.chat, 
`🔍 *Generando respuesta...*
⏳ Modelo: MayCode v2
Espera un momento por favor...`, m);

  try {
    const data = await fetchMayCode(text.trim());

    const respuestaTexto = `
📌 *MayCode — Resultado*

🗨️ *Tú:* ${data.user || text}
🤠 *MayCode:* ${data.MayCode || 'No se generó una explicación'}

💻 *Código a continuación...*
🌐 Powered by NightAPI — Dev *SoyMaycol*
    `.trim();

    const codigo = data.code?.trim() || '// Sin código generado';

    // Enviar explicación primero
    await conn.sendMessage(m.chat, { text: respuestaTexto }, { quoted: m });

    // Enviar código como mensaje aparte
    await conn.sendMessage(m.chat, { text: '```' + codigo + '```' }, { quoted: m });

  } catch (e) {
    console.error(e);
    await conn.reply(m.chat, 
`❌ *Error de conexión con MayCode*

Todas las instancias están fuera de servicio por ahora.

Por favor, intenta nuevamente más tarde.`, m);
  }
};

handler.help = ['maycode'];
handler.tags = ['tools'];
handler.command = ['maycode', 'codigo'];

export default handler;
