import { Boom } from '@hapi/boom';
import fs from "fs";
import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import path from 'path';
import { fileURLToPath } from 'url';
import qrcode from 'qrcode-terminal';
import input from 'input';
import ph from 'awesome-phonenumber';
import P from 'pino';

import handleMessages from './handler/messages.js';
import handleEvents from './handler/events.js';
import { cleanSession } from './session.js';

const verbose = process.argv.includes('-v');
const pino = P({ level: verbose ? 'info' : 'silent' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFolder = path.join(__dirname, '..', 'auth');
const credsFile = path.join(authFolder, 'creds.json');

let pairing = false;

async function startSock(restart = false) {
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  if (!fs.existsSync(credsFile)) {
    const select = await input.select('Select one', [
      { name: 'Scan QR', value: 1 },
      { name: 'Pairing code', value: 2 },
      { name: 'Exit', value: 0 }
    ], { default: 1 });

    pairing = select === 2;

    if (select === 0) process.exit(0);
  }

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino)
    },
    logger: pino,
    getMessage: null,
    browser: Browsers.windows('Chrome')
  });

  sock.ev.on('creds.update', saveCreds);

  const keepAliveInterval = setInterval(async () => {
    try {
      await sock.sendPresenceUpdate('available');
    } catch (e) {
      console.log('Keep-alive ping failed', e.message || e);
    }
  }, 60000);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr, receivedPendingNotifications }) => {
    if (receivedPendingNotifications) sock.ev.flush();

    if (qr && !pairing) {
      qrcode.generate(qr, { small: true });
      console.log('Scan QR in WhatsApp > Linked devices > Link a device.');
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;

      switch (reason) {
        case DisconnectReason.badSession:
          console.log('Corrupt session file. Delete it and rescan.');
          clearInterval(keepAliveInterval);
          await startSock(true);
          break;

        case DisconnectReason.connectionClosed:
        case DisconnectReason.connectionLost:
        case DisconnectReason.restartRequired:
        case DisconnectReason.timedOut:
        case 503:
          console.log('Connection lost (possibly idle), reconnecting...');
          try { if (sock.ws) sock.ws.close(); } catch {}
          clearInterval(keepAliveInterval);
          setTimeout(() => startSock(true), 3000);
          return;

        case DisconnectReason.connectionReplaced:
          console.log('Connection replaced by another session. Stop other sessions to reconnect.');
          break;

        case DisconnectReason.loggedOut:
          console.log('Device logged out. Exiting...');
          clearInterval(keepAliveInterval);
          process.exit(0);
          break;

        case DisconnectReason.multideviceMismatch:
          console.log('Multi-device mismatch. Please rescan.');
          break;

        default:
          console.log('Unknown disconnect reason:', reason);
      }
    }

    if (connection === 'connecting') console.log('Connecting...');
    if (connection === 'open') console.log('Connected successfully!\n');
  });

  handleMessages(sock);
  handleEvents(sock);
}

startSock();
