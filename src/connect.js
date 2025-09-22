import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from "cors";
import qrcode from 'qrcode-terminal';
import input from 'input';
import ph from 'awesome-phonenumber';
import P from 'pino';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';

import setupSocket from './handler/socket.js';
import setupExpress from './handler/express.js';
// import { cleanSession } from './session.js' // optional cleanup tool

// Basic setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFolder = path.join(__dirname, '..', 'auth');
const credsFile = path.join(authFolder, 'creds.json');

const verbose = process.argv.includes('-v');
const pino = P({ level: verbose ? 'info' : 'silent' });

// Express + Socket.IO setup
const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

app.use(express.json());
app.get('/', (req, res) => res.send('WhatsApp bot is running.'));

// Automatically load all express routes from commands/express
await setupExpress(app);

httpServer.listen(3000, () => {
  console.log('🔌 Express + Socket.IO running on http://localhost:3000');
  process.send?.('Server ready');
});

// cleanSession(); // Optional

let pairing = false;

async function startSock(restart = false) {
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  // Login choice
  if (!fs.existsSync(credsFile)) {
    const select = await input.select('Login method:', [
      { name: 'Scan QR', value: 1 },
      { name: 'Pairing code', value: 2 },
      { name: 'Exit', value: 0 }
    ], { default: 1 });

    if (select === 0) process.exit(0);
    pairing = select === 2;
  }

  // Create WA socket
  const sock = makeWASocket({
    logger: pino,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino)
    },
    getMessage: null,
    browser: Browsers.windows('Chrome')
  });

  global.sock = sock;
  sock.ev.on('creds.update', saveCreds);

  // WA connection handling
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr, receivedPendingNotifications }) => {
    if (receivedPendingNotifications) sock.ev.flush();

    if (qr && !pairing) {
      qrcode.generate(qr, { small: true });
      console.log('Scan the QR in WhatsApp > Linked Devices');
    }

    if (qr && pairing) {
      const phoneInput = await input.text('Phone number (with country code):', {
        validate(input) {
          if (!input) return 'Required';
          if (!ph(input)?.g?.number?.e164) return 'Invalid format';
          return true;
        }
      });

      const phone = ph(phoneInput).g.number.e164.slice(1);
      const code = await sock.requestPairingCode(phone);
      console.log('[PAIRING CODE]', code?.match(/.{1,4}/g)?.join('-') || code);
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp connected');
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      switch (reason) {
        case DisconnectReason.badSession:
        case DisconnectReason.connectionClosed:
        case DisconnectReason.connectionLost:
        case DisconnectReason.restartRequired:
        case DisconnectReason.timedOut:
          console.log('🔁 Reconnecting...');
          return startSock(true);
        case DisconnectReason.loggedOut:
          console.log('🚪 Logged out. Exit.');
          break;
        default:
          console.log('❌ Disconnected. Reason:', reason);
      }
      process.exit(1);
    }
  });


  // Setup Socket.IO command handlers
  io.on('connection', (socket) => setupSocket(socket, sock));
}

startSock();
