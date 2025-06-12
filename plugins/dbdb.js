// Archivo: plugins/playvreden2.js
import fetch from 'node-fetch';

const handler = async (m, { conn, text, command }) => {
  if (!text) throw `
❒ ლ *Uso del comando ${command}*
> ✦ Ingresa el nombre o enlace de un video de YouTube.
> ☄︎ Ejemplo:
> ${command} Unstoppable
  `.trim();

  // Reacción inicial 💫
  await conn.sendMessage(m.chat, { react: { text: "🐦‍🔥", key: m.key } });

  try {
    const res = await fetch(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(text)}`);
    const json = await res.json();

    if (!json.status || !json.result || !json.result.url) {
      throw '❀ No se pudo obtener el audio. Verifica el enlace.';
    }

    const { title, channel, duration, thumb, size, quality, url } = json.result;

    // Reacción de éxito ☄︎
    await conn.sendMessage(m.chat, { react: { text: "☄︎", key: m.key } });

    // Mensaje con detalles decorado
    await conn.sendMessage(m.chat, {
      image: { url: thumb },
      caption: `
╭─❒✦✿ *DETALLES* ✿✦❒─╮
> ✿ *Título:* ${title}
> ❀ *Canal:* ${channel}
> ლ *Duración:* ${duration}
> ✦ *Calidad:* ${quality}
> ❒ *Tamaño:* ${size}
╰─☄︎───────────────☄︎─╯

> ❒✦ *Enviando audio...*
`.trim()
    }, { quoted: m });

    // Enviar el audio limpio
    await conn.sendMessage(m.chat, {
      audio: { url },
      mimetype: 'audio/mpeg',
      ptt: false
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    await conn.sendMessage(m.chat, { react: { text: "🪬", key: m.key } });
    m.reply(`
❀✿ *Error*
> ✦ No se pudo procesar tu solicitud.
> ლ Verifica que el video exista o intenta más tarde.
`.trim());
  }
};

handler.command = ['play1']

export default handler;