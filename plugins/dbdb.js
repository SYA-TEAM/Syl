import fetch from 'node-fetch';

const buscarYT = async (query) => {
  const res = await fetch(`https://delirius-apiofc.vercel.app/search/ytsearch?q=${encodeURIComponent(query)}`);
  const json = await res.json();
  if (!json.status || !json.result || !json.result[0]) throw '✿ No se encontró el video.';
  return json.result[0].url;
};

const handler = async (m, { conn, text, command }) => {
  if (!text) throw `
❒ ლ *Uso del comando ${command}*
> ✦ Ingresa el nombre o enlace de un video de YouTube.
> ❀ Ejemplo:
> ${command} Another Love
> ${command} https://youtu.be/abcdef
  `.trim();

  // Reacción inicial ✦
  await conn.sendMessage(m.chat, { react: { text: "✿", key: m.key } });

  try {
    let linkYT = text;
    if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
      // Buscar con Delirius API
      linkYT = await buscarYT(text);
    }

    const res = await fetch(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(linkYT)}`);
    const json = await res.json();
    if (!json.status || !json.result || !json.result.url) throw '❀ No se pudo obtener el audio.';

    const { title, channel, duration, thumb, size, quality, url } = json.result;

    // Reacción de éxito ☄︎
    await conn.sendMessage(m.chat, { react: { text: "☄︎", key: m.key } });

    // Enviar detalles
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

    // Enviar el audio sin contextInfo
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
> ლ Intenta con otro nombre o verifica el enlace.
`.trim());
  }
};

handler.command = ['play1'];
handler.help = ['play1 <nombre o enlace>'];
handler.tags = ['descargas'];
handler.register = true;

export default handler;