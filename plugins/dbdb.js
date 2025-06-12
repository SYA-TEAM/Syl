import fetch from 'node-fetch';

const buscarEnYouTube = async (query) => {
  const res = await fetch(`https://delirius-apiofc.vercel.app/search/ytsearch?q=${encodeURIComponent(query)}`);
  const json = await res.json();
  if (!json.status || !json.result || !json.result[0]) throw '❀ No se encontró ningún resultado.';
  return json.result[0].url;
};

const handler = async (m, { conn, text, command }) => {
  if (!text) throw `
❒ ლ *Uso del comando ${command}*
> ✦ Ingresa el nombre o enlace de un video de YouTube.
> ❀ Ejemplo:
> ${command} Another Love
> ${command} https://youtu.be/abcd1234
  `.trim();

  await conn.sendMessage(m.chat, { react: { text: "✿", key: m.key } });

  try {
    // Si es texto, buscar en YouTube
    let videoUrl = text;
    if (!text.includes('youtu.be') && !text.includes('youtube.com')) {
      videoUrl = await buscarEnYouTube(text);
    }

    const res = await fetch(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(videoUrl)}`);
    const json = await res.json();

    if (!json || !json.result || !json.result.url) throw '❀ No se pudo obtener el audio.';

    const { title, channel, duration, thumb, size, quality, url } = json.result;

    await conn.sendMessage(m.chat, { react: { text: "☄︎", key: m.key } });

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

    await conn.sendMessage(m.chat, {
      audio: { url },
      mimetype: 'audio/mpeg',
      ptt: false
    }, { quoted: m });

  } catch (e) {
    console.error('[❌ ERROR]', e);
    await conn.sendMessage(m.chat, { react: { text: "🪬", key: m.key } });
    m.reply(`
❀✿ *Error*
> ✦ No se pudo procesar tu solicitud.
> ლ Intenta con otro nombre o verifica el enlace.
`.trim());
  }
};

handler.command = ['play1'];
handler.help = ['play1 <nombre o enlace']

export default handler;