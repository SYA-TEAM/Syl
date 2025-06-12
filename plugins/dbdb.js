import fetch from 'node-fetch';

let handler = async (m, { conn, usedPrefix, command, text }) => {
  if (!text) {
    return m.reply(`
> ╭─❒✦✿ *USO* ✿✦❒─╮
> ✿ Ingresa el nombre de una canción o un enlace de YouTube.
> ❀ Ejemplo:
> ${usedPrefix + command} shakira
> ╰─☄︎──────────────☄︎─╯
`.trim())
  }

  try {
    await conn.sendMessage(m.chat, { react: { text: "🕒", key: m.key } })

    const searchApi = `https://delirius-apiofc.vercel.app/search/ytsearch?q=${text}`;
    const searchResponse = await fetch(searchApi);
    const searchData = await searchResponse.json();

    if (!searchData?.data || searchData.data.length === 0) {
      return m.reply(`✦ No se encontraron resultados para: *${text}*`);
    }

    const video = searchData.data[0]; // Primer resultado
    const { title, author, duration, views, publishedAt, url, image } = video

    await conn.sendMessage(m.chat, { react: { text: "🕛", key: m.key } })

    await conn.sendMessage(m.chat, {
      image: { url: image },
      caption: `
> ╭─❒✦✿ *DETALLES* ✿✦❒─╮
> ✿ *Título:* ${title}
> ❀ *Canal:* ${author.name}
> ლ *Duración:* ${duration}
> ✦ *Publicado:* ${publishedAt}
> ❒ *Vistas:* ${formatViews(views)}
> ☄︎ *Enlace:* ${url}
> ╰─☄︎─────────────☄︎─╯

> ❒✦ *Enviando audio...*
`.trim()
    }, { quoted: m });

    const downloadApi = `https://api.vreden.my.id/api/ytmp3?url=${url}`;
    const downloadResponse = await fetch(downloadApi);
    const downloadData = await downloadResponse.json();

    const audioUrl = downloadData?.result?.download?.url;
    if (!audioUrl) {
      return m.reply(`
*✖︎ No se pudo obtener el audio del video.*
> ლ Intenta con otro título o enlace.
`.trim());
    }

    await conn.sendMessage(m.chat, {
      audio: { url: audioUrl },
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`,
      ptt: false
    }, { quoted: m });

    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error(error)
    await conn.sendMessage(m.chat, { react: { text: "🪬", key: m.key } })
    m.reply(`
✖︎ *Error inesperado*
> ✦ No se pudo completar la solicitud.
> ლ Detalles: ${error.message}
`.trim())
  }
};

handler.command = ['play1', 'playaudio'];

export default handler;

function formatViews(views) {
  if (!views) return "No disponible"
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k`
  return views.toString()
}