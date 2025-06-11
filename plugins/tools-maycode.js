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
  throw new Error('Todas las instancias de la API están fuera de servicio.');
}

const handler = async (m, { conn, text }) => {
  if (!text) {
    return conn.reply(m.chat,
`📌 *Uso correcto del comando: .maycode*

Escribe tu solicitud o pregunta relacionada con código.

Ejemplo:
.maycode ¿Cómo crear un input con bordes redondeados en HTML?

Modelo actual: *MayCode v2*`, m, { ...rcanal });
  }

  await conn.reply(m.chat,
`🔄 *Procesando tu solicitud...*
Modelo: MayCode v2

Por favor, espera un momento mientras se genera la respuesta.`, m, { ...rcanal });

  try {
    const data = await fetchMayCode(text.trim());

    const respuestaTexto = `
📎 *Resultado generado por MayCode*

🧑 Pregunta: ${data.user || text}
⚔️ Respuesta: ${data.MayCode || 'No se generó una explicación.'}

A continuación, se presenta el bloque de código generado.
Fuente: *NightAPI – Desarrollado por SoyMaycol*
    `.trim();

    const codigo = data.code?.trim() || '// No se generó ningún código.';

    await conn.sendMessage(m.chat, { text: respuestaTexto }, { quoted: m, ...rcanal });
    await conn.sendMessage(m.chat, { text: codigo }, { quoted: m, ...rcanal });

  } catch (e) {
    console.error(e);
    await conn.reply(m.chat,
`❌ *Error al obtener respuesta de MayCode*

Actualmente, todas las instancias están fuera de servicio.

Te sugerimos intentarlo nuevamente más tarde.`, m, { ...rcanal });
  }
};

handler.help = ['maycode'];
handler.tags = ['tools'];
handler.command = ['maycode', 'codigo'];

export default handler;
