const {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  MessageRetryMap,
  makeCacheableSignalKeyStore,
  jidNormalizedUser
} = await import('@whiskeysockets/baileys');
import moment from 'moment-timezone';
import NodeCache from 'node-cache';
import readline from 'readline';
import qrcode from "qrcode";
import crypto from 'crypto';
import fs from "fs";
import pino from 'pino';
import * as ws from 'ws';
const { CONNECTING } = ws;
import { Boom } from '@hapi/boom';
import { makeWASocket } from '../lib/simple.js';

if (!(global.conns instanceof Array)) global.conns = [];

let handler = async (m, { conn: _conn, args, usedPrefix, command }) => {
  let parent = _conn;

  async function serbot() {
    let authFolderB = m.sender.split('@')[0];
    const userFolderPath = `./Data/Sesiones/Subbots/${authFolderB}`;

    // Verificar si ya existe una sesión activa
    if (fs.existsSync(`${userFolderPath}/creds.json`) && !args[0]) {
      return await parent.reply(m.chat, `⚠️ *Ya tienes una sesión activa.*\n\n🔁 Si deseas reiniciar tu subbot:\n1️⃣ Usa *${usedPrefix}delsesion*\n2️⃣ Luego ejecuta *${usedPrefix}cou* nuevamente.`, m);
    }

    if (!fs.existsSync(userFolderPath)) {
      fs.mkdirSync(userFolderPath, { recursive: true });
    }

    if (args[0]) {
      const jsonCreds = JSON.parse(Buffer.from(args[0], "base64").toString("utf-8"));
      fs.writeFileSync(`${userFolderPath}/creds.json`, JSON.stringify(jsonCreds, null, '\t'));
    }

    const { state, saveCreds } = await useMultiFileAuthState(userFolderPath);
    const msgRetryCounterCache = new NodeCache();
    const msgRetryCounterMap = (MessageRetryMap) => { };
    const { version } = await fetchLatestBaileysVersion();
    let phoneNumber = m.sender.split('@')[0];

    const methodCode = true;

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (text) => new Promise((resolve) => rl.question(text, resolve));

    const connectionOptions = {
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
      },
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      getMessage: async (key) => {
        let jid = jidNormalizedUser(key.remoteJid);
        let msg = await store.loadMessage(jid, key.id);
        return msg?.message || "";
      },
      msgRetryCounterCache,
      msgRetryCounterMap,
      version
    };

    let conn = makeWASocket(connectionOptions);

    if (methodCode && !conn.authState.creds.registered) {
      if (!phoneNumber) process.exit(0);
      let cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
      setTimeout(async () => {
        let codeBot = await conn.requestPairingCode(cleanedNumber);
        codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;

        const txt = `
╭━━ 🎀 *Vincula x Code* 🎀 ━━╮
┃ 📱 *Pasos:*
┃ 1. Abre WhatsApp
┃ 2. Toca los 3 puntos (⋮)
┃ 3. Entra a *Dispositivos vinculados*
┃ 4. Toca *Vincular con número*
┃ 5. Ingresa este código:
╰━━━━━━━━━━━━━━╯`.trim();

        const txtCode = `🔐 *Tu código es:* \n\n🔹 *${codeBot}*`;

        await parent.reply(m.chat, txt, m);
        await parent.reply(m.chat, txtCode, m);
        rl.close();
      }, 3000);
    }

    conn.isInit = false;
    let isInit = true;

    async function connectionUpdate(update) {
      const { connection, lastDisconnect, isNewLogin } = update;

      if (isNewLogin) conn.isInit = true;
      const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;

      if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
        let i = global.conns.indexOf(conn);
        if (i < 0) return console.log(await creloadHandler(true).catch(console.error));
        delete global.conns[i];
        global.conns.splice(i, 1);
        fs.rmSync(userFolderPath, { recursive: true, force: true });
        if (code !== DisconnectReason.connectionClosed) {
          parent.sendMessage(m.chat, { text: "⚠️ *Conexión perdida...*" }, { quoted: m });
        }
      }

      if (connection == 'open') {
        conn.isInit = true;
        global.conns.push(conn);

        await parent.reply(m.chat, args[0] ? '✅ *Sub Bot conectado exitosamente.*' : `
╭━━ 🎉 *¡Sub Bot Conectado!* 🎉 ━━╮
┃ 🍫 *Yuru Yuri activada como Sub Bot*
┃ 📡 Conexión establecida correctamente
┃ 🧾 Usa *${usedPrefix}code* si se desconecta
┃ 👤 Usuario vinculado: @${authFolderB}
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`.trim(), m);

        await sleep(3000);

        if (!args[0]) {
          await parent.sendMessage(conn.user.jid, {
            text: `📎 *Guarda este mensaje para reconectar rápido:*\n\n${usedPrefix + command + " " + Buffer.from(fs.readFileSync(`${userFolderPath}/creds.json`), "utf-8").toString("base64")}`
          }, { quoted: m });
        }
      }
    }

    setInterval(async () => {
      if (!conn.user) {
        try { conn.ws.close() } catch { }
        conn.ev.removeAllListeners();
        let i = global.conns.indexOf(conn);
        if (i < 0) return;
        delete global.conns[i];
        global.conns.splice(i, 1);
      }
    }, 60000);

    let handler = await import('../handler.js');
    let creloadHandler = async function (restatConn) {
      try {
        const Handler = await import(`../handler.js?update=${Date.now()}`).catch(console.error);
        if (Object.keys(Handler || {}).length) handler = Handler;
      } catch (e) {
        console.error(e);
      }
      if (restatConn) {
        try { conn.ws.close() } catch { }
        conn.ev.removeAllListeners();
        conn = makeWASocket(connectionOptions);
        isInit = true;
      }

      if (!isInit) {
        conn.ev.off('messages.upsert', conn.handler);
        conn.ev.off('connection.update', conn.connectionUpdate);
        conn.ev.off('creds.update', conn.credsUpdate);
      }

      conn.handler = handler.handler.bind(conn);
      conn.connectionUpdate = connectionUpdate.bind(conn);
      conn.credsUpdate = saveCreds.bind(conn, true);

      conn.ev.on('messages.upsert', conn.handler);
      conn.ev.on('connection.update', conn.connectionUpdate);
      conn.ev.on('creds.update', conn.credsUpdate);
      isInit = false;
      return true;
    };

    creloadHandler(false);
  }

  serbot();
};

handler.help = ['code'];
handler.command = ['cou', 'code'];
handler.tags = ['serbot']
handler.rowner = false;

export default handler;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}