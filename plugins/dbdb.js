import fetch from 'node-fetch';
import yts from 'yt-search';

const youtubeRegexID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/

const handler = async (m, { conn, text, command }) => {
  try {
    if (!text.trim()) {
      return conn.reply(m.chat, `
❒ ლ *Uso del comando ${command}*
> ✦ Ingresa el nombre o enlace de un video de YouTube.
> ❀ Ejemplo:
> ${command} unstoppable
      `.trim(), m)
    }

    // Reacción inicial
    await conn.sendMessage(m.chat, { react: { text: "❀", key: m.key } });

    let videoIdMatch = text.match(youtubeRegexID);
    let ytData = await yts(videoIdMatch ? `https://youtu.be/${videoIdMatch[1]}` : text);

    let video = videoIdMatch
      ? ytData.videos.find(v => v.videoId === videoIdMatch[1])
      : ytData.videos?.[0];

    if (!video) return m.reply('✧ No se encontró ningún video.');

    const { title, thumbnail, timestamp, views, ago, url, author } = video;
    const canal = author?.name || 'Desconocido';
    const vistas = formatViews(views);

    // Reacción éxito
    await conn.sendMessage(m.chat, { react: { text: "✦", key: m.key } });

    // Mensaje decorado
    await conn.sendMessage(m.chat, {
      image: { url: thumbnail },
      caption: `
╭─❒✦✿ *DETALLES DEL VIDEO* ✿✦❒─╮
> ✿ *Título:* ${title}
> ❀ *Canal:* ${canal}
> ლ *Duración:* ${timestamp}
> ✦ *Publicado:* ${ago}
> ❒ *Vistas:* ${vistas}
> ☄︎ *Enlace:* ${url}
╰─☄︎──────────────☄︎─╯

> ❒✦ *Enviando audio...*
`.trim()
    }, { quoted: m });

    // Descargar y enviar audio
    const api = await (await fetch(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(url)}`)).json();
    const audioUrl = api?.result?.url;

    if (!audioUrl) {
      return m.reply(`
❀✿ *Error*
> ✦ No se pudo obtener el audio.
> ლ Intenta con otro video o revisa el enlace.
`.trim());
    }

    await conn.sendMessage(m.chat, {
      audio: { url: audioUrl },
      mimetype: 'audio/mpeg',
      fileName: `${api.result.title}.mp3`,
      ptt: false
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    await conn.sendMessage(m.chat, { react: { text: "🪬", key: m.key } });
    return m.reply(`
❀✿ *Error*
> ✦ No se pudo procesar tu solicitud.
> ლ Intenta con otro nombre o verifica el enlace.
`.trim());
  }
};

handler.command = ['play1'];
handler.tags = ['descargas'];
handler.help = ['play'];
handler.group = false;

export default handler;

function formatViews(views) {
  if (!views) return "No disponible";
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k`;
  return views.toString();
}