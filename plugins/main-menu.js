import fetch from 'node-fetch';
import sharp from 'sharp';
import { promises as fs } from 'fs';

let handler = async (m, { conn, usedPrefix, command }) => {
  let nombre = await conn.getName(m.sender);
  let fileName = `✦ ʏᴜʀᴜ ʏᴜʀɪ ✧`;

  // Detectar si es el bot principal o un sub bot
  let mainBotNumber = '50493059810@s.whatsapp.net'; // <-- Número del bot principal (ajusta según sea necesario)
  let esPrincipal = conn.user.jid === mainBotNumber;
  let estadoBot = esPrincipal ? '\`✧ Bot:\` *Principal*' : '\`✧ Bot:\` *Sub Bot*';

  // Obtener el menú agrupado por tags
  const groups = {};
  for (let cmd of Object.values(global.plugins)) {
    if (!cmd.help || !cmd.tags) continue;
    for (let tag of cmd.tags) {
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(cmd.help.flat());
    }
  }

  // Formar el texto del menú
  let cap = `${estadoBot}\n\n⊂(◉‿◉)つ ¡Hola ${nombre}!\n> Aquí tienes el menú:\n\n`;

  for (let tag in groups) {
    cap += `✿ *${tag.toUpperCase()}*\n`;
    for (let cmds of groups[tag]) {
      for (let cmd of cmds) {
        cap += `• ${usedPrefix}${cmd}\n`;
      }
    }
    cap += `\n`;
  }

  // Imagen del documento
  let localImageBuffer = await fs.readFile("./src/menu.jpg");

  // Miniatura del documento
  let miniThumbnail = await sharp(localImageBuffer)
    .resize(200, 200)
    .jpeg({ quality: 70 })
    .toBuffer();

  // Imagen para el adReply
  let adreplyImage = miniThumbnail;

  try {
    const apiURL = `https://nightapi.is-a.dev/api/mayeditor?url=https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAoH2L-_2H07icZqJWQ-1wJZRYXTAmlDJlgbcrYaoIswQsuR6M61b30JU&s=10&texto=¡Hola%20${encodeURIComponent(nombre)}!&textodireccion=Centro&fontsize=70`;
    const res = await fetch(apiURL);
    const json = await res.json();
    if (json.success) {
      const imgRes = await fetch(json.edited_url);
      adreplyImage = await imgRes.buffer();
    }
  } catch (e) {
    console.warn("⚠️ Error al obtener miniatura de la API, usando fallback");
  }

  // Enviar el documento como menú
  await conn.sendMessage(m.chat, {
    document: localImageBuffer,
    mimetype: "image/jpeg",
    fileName,
    caption: cap,
    jpegThumbnail: miniThumbnail,
    contextInfo: {
      externalAdReply: {
        title: `Menu solicitado por ${nombre}`,
        body: `🤍 Comandos actualizados 🛠️`,
        thumbnail: adreplyImage,
        mediaType: 1,
        renderLargerThumbnail: true,
        sourceUrl: "https://github.com", // tu link aquí
      },
    },
  }, { quoted: m });
};

handler.command = ["menu", "menú", "help", "ayuda"];
export default handler;