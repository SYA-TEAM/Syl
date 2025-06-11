import fetch from 'node-fetch';
import sharp from 'sharp';
import { promises as fs } from 'fs';

let handler = async (m, { conn, usedPrefix, command }) => {
  let nombre = await conn.getName(m.sender);
  let fileName = `✦ ʏᴜʀᴜ ʏᴜʀɪ ✧`;

  // Definir uptime
  const uptime = process.uptime() * 1000;

  // Función para convertir el tiempo a formato legible
  function rTime(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms % 3600000 / 60000);
    let s = Math.floor(ms % 60000 / 1000);
    return `${h}h ${m}m ${s}s`;
  }

  // Detectar si es el bot principal o un sub bot
  let mainBotNumber = '50493059810@s.whatsapp.net'; // <-- Número del bot principal
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
  let cap = `${estadoBot}\n\n❀ *Tiempo activa:* ${rTime(uptime)}\n\n⊂(◉‿◉)つ ¡Hola ${nombre}!\n> Aquí tienes el menú:\n\n`;

  for (let tag in groups) {
    cap += `✿ *${tag.toUpperCase()}*\n`;
    for (let cmds of groups[tag]) {
      for (let cmd of cmds) {
        cap += `• ${usedPrefix}${cmd}\n`;
      }
    }
    cap += `\n`;
  }

  // Leer imagen del menú
  let localImageBuffer = await fs.readFile("./src/menu.jpg");

  // Crear miniatura
  let miniThumbnail = await sharp(localImageBuffer)
    .resize(200, 200)
    .jpeg({ quality: 70 })
    .toBuffer();

  // Imagen para el adReply
  let adreplyImage = miniThumbnail;

  // Intentar usar imagen generada por API (opcional)
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

  // Enviar documento con menú
  await conn.sendMessage(m.chat, {
    document: localImageBuffer,
    mimetype: "image/jpeg",
    fileName,
    caption: cap,
    jpegThumbnail: miniThumbnail,
    contextInfo: {
      ...global.rcanal?.contextInfo,
      externalAdReply: {
        title: `Menu solicitado por ${nombre}`,
        body: `🤍 Comandos actualizados 🛠️`,
        thumbnail: adreplyImage,
        mediaType: 1,
        renderLargerThumbnail: true,
        sourceUrl: "https://github.com", // ← cambia esto por tu enlace real
      },
    },
  }, { quoted: m });
};

handler.command = ["menu", "menú", "help", "ayuda"];
export default handler;