import fetch from "node-fetch";
import yts from "yt-search";
import axios from "axios";
import { createCanvas, loadImage } from "canvas";
import { getAverageColor } from "fast-average-color-node";

const formatAudio = ["mp3", "m4a", "webm", "acc", "flac", "opus", "ogg", "wav"];
const formatVideo = ["360", "480", "720", "1080", "1440", "4k"];
const limit = 100;

const ddownr = {
  download: async (url, format) => {
    if (!formatAudio.includes(format) && !formatVideo.includes(format)) {
      throw new Error("⚠ Formato no soportado.");
    }

    const config = {
      method: "GET",
      url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
      headers: { "User-Agent": "Mozilla/5.0" }
    };

    const response = await axios.request(config);
    if (response.data?.success) {
      const { id, title, info } = response.data;
      const downloadUrl = await ddownr.cekProgress(id);
      return { title, downloadUrl, image: info.image };
    } else {
      throw new Error("⛔ No se pudo obtener detalles.");
    }
  },

  cekProgress: async (id) => {
    const config = {
      method: "GET",
      url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
      headers: { "User-Agent": "Mozilla/5.0" }
    };

    while (true) {
      const res = await axios.request(config);
      if (res.data?.success && res.data.progress === 1000) {
        return res.data.download_url;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

const handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply("✧ Ingresa el nombre de un video o URL de YouTube.");
  await m.react("🕛");

  const res = await yts(text);
  if (!res.all.length) return m.reply("⛔ No se encontraron resultados.");

  const video = res.all[0];
  const total = Number(video.duration.seconds) || 60;
  const current = Math.floor(Math.random() * (total - 30 + 1)) + 30;

  const thumbnail = await create(video.thumbnail, {
    title: video.title,
    author: video.author.name,
    duration: video.duration.timestamp,
    views: video.views.toLocaleString(),
    current,
    total
  });

  await conn.sendFile(m.chat, thumbnail, "thumb.jpg", undefined, m);

  if (["play", "yta", "ytmp3"].includes(command)) {
    try {
      const api = await ddownr.download(video.url, "mp3");
      await conn.sendMessage(m.chat, {
        audio: { url: api.downloadUrl },
        mimetype: "audio/mpeg",
        fileName: `${video.title}.mp3`,
        ptt: false
      }, { quoted: m });

      await m.react("✅");
    } catch (e) {
      return m.reply("⛔ Error al descargar audio.");
    }
  }

  if (["play2", "ytv", "ytmp4"].includes(command)) {
    try {
      const fuentes = [
        `https://api.siputzx.my.id/api/d/ytmp4?url=${video.url}`,
        `https://api.zenkey.my.id/api/download/ytmp4?apikey=zenkey&url=${video.url}`,
        `https://axeel.my.id/api/download/video?url=${encodeURIComponent(video.url)}`,
        `https://delirius-apiofc.vercel.app/download/ytmp4?url=${video.url}`
      ];

      for (const fuente of fuentes) {
        try {
          const r = await fetch(fuente);
          const j = await r.json();
          const link = j?.data?.dl || j?.result?.download?.url || j?.downloads?.url || j?.data?.download?.url;
          if (!link) continue;

          const head = await fetch(link, { method: "HEAD" });
          const size = parseInt(head.headers.get("Content-Length")) || 0;
          const asDoc = (size / 1024 / 1024) >= limit;

          await conn.sendFile(m.chat, link, `${video.title}.mp4`, undefined, m, null, {
            asDocument: asDoc,
            mimetype: "video/mp4"
          });

          await m.react("✅");
          return;
        } catch { }
      }

      return m.reply("⛔ No se pudo descargar desde ninguna fuente.");
    } catch (e) {
      return m.reply("⛔ Error al descargar video.");
    }
  }
};

handler.help = ["play"];
handler.tags = ["download"];
handler.command = ["pl"];

export default handler;

function formatTime(sec) {
  const min = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${min}:${s}`;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (const word of words) {
    const testLine = line + word + ' ';
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && line) {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = testLine;
    }
  }

  if (line) lines.push(line.trim());
  return lines;
}

async function create(imageUrl, { title, author, duration, views, current, total }) {
  const canvas = createCanvas(1280, 720);
  const ctx = canvas.getContext('2d');

  // Cargar imagen de miniatura
  const res = await fetch(imageUrl);
  const buffer = await res.buffer();
  const img = await loadImage(buffer);

  // Obtener color promedio para fondo degradado suave
  const { value: [r, g, b] } = await getAverageColor(buffer);
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dibujar miniatura escalada para llenar
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Fondo semitransparente para datos
  const overlayHeight = 220;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

  // Texto título con ajuste y espaciado
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 38px Sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const paddingX = 50;
  const paddingY = canvas.height - overlayHeight + 30;
  const maxTextWidth = canvas.width - 2 * paddingX;

  const lines = wrapText(ctx, title, maxTextWidth);
  lines.slice(0, 3).forEach((line, i) => {
    ctx.fillText(line, paddingX, paddingY + i * 42);
  });

  // Datos adicionales
  ctx.font = '28px Sans-serif';
  const infoYStart = paddingY + lines.length * 42 + 15;
  ctx.fillText(`Canal: ${author}`, paddingX, infoYStart);
  ctx.fillText(`Duración: ${duration}`, paddingX, infoYStart + 38);
  ctx.fillText(`Vistas: ${views}`, paddingX, infoYStart + 76);

  // Barra de progreso de duración
  const barX = paddingX;
  const barY = canvas.height - 30;
  const barWidth = canvas.width - 2 * paddingX;
  const barHeight = 10;
  const progress = Math.min(current / total, 1);

  // Fondo barra
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Progreso
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(barX, barY, barWidth * progress, barHeight);

  // Texto tiempos
  ctx.font = '20px Sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatTime(current), barX, barY - 10);
  ctx.textAlign = 'right';
  ctx.fillText(formatTime(total), barX + barWidth, barY - 10);

  return canvas.toBuffer();
}