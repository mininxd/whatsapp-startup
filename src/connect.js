import { Boom } from '@hapi/boom';
import baileys from '@whiskeysockets/baileys';
import path from 'path';
import { fileURLToPath } from 'url';
import qrcode from 'qrcode-terminal';
import input from 'input';
import ph from 'awesome-phonenumber';
import P from 'pino';

import handleMessages from './handler/messages.js';
import handleEvents from './handler/events.js';
import { cleanSession } from './session.js';

// Clean old session first
cleanSession();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore
} = baileys;

const pino = P({ level: 'silent' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFolder = path.join(__dirname, '..', 'auth');
const credsFile = path.join(authFolder, 'creds.json');

let pairing = false;

async function startSock(restart = false) {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  // If no creds exist, ask user for connection method
  if (!credsFile) {
    console.log('1', 'Scan QR');
    console.log('2', 'Pairing code');
    console.log('0', 'Exit');

    const select = await input.select('Select one', [
      { name: 'Scan QR', value: 1 },
      { name: 'Pairing code', value: 2 },
      { name: 'Exit', value: 0 }
    ], { default: 1 });

    pairing = select === 2;

    if (select === 0) {
      console.log('Canceled! Exiting...');
      process.exit(0);
    }
  }

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino)
    },
    logger: pino,
    getMessage: null,
    browser: Browsers.windows('Chrome')
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr, receivedPendingNotifications }) => {
    if (receivedPendingNotifications) sock.ev.flush();

    if (qr && !pairing) {
      qrcode.generate(qr, { small: true });
      console.log('Open WhatsApp, then click the three dots > Linked devices > Link a device > Scan the QR code.');
    }

    if (qr && pairing) {
      // Temporarily silence logs
      const { log, warn, error } = console;
      console.log = console.warn = console.error = () => {};
      pino.level = 'silent';

      const phoneInput = await input.text('Phone number (with country code):', {
        validate(input) {
          if (!input) return 'Phone number is required!';
          if (!ph(input)?.g?.number?.e164) return 'Invalid number! Use the country code.';
          return true;
        }
      });

      const phone = ph(phoneInput).g.number.e164.slice(1);

      console.log = log;
      console.warn = warn;
      console.error = error;
      pino.level = process.env.LEVEL || 'silent';

      const code = await sock.requestPairingCode(phone);
      console.log('Click the notification on your Android/iOS device.');
      console.log('If not, open WhatsApp > Linked devices > Link with phone number and enter this code:');
      console.log('[PAIRING] Code:', code?.match(/.{1,4}/g)?.join('-') || code);
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;

      switch (reason) {
        case DisconnectReason.badSession:
          console.log('Corrupt session file, delete it and rescan.');
          break;
        case DisconnectReason.connectionClosed:
        case DisconnectReason.connectionLost:
        case DisconnectReason.restartRequired:
        case DisconnectReason.timedOut:
          console.log('Connection issue, reconnecting...');
          await startSock(true);
          break;
        case DisconnectReason.connectionReplaced:
          console.log('Connection replaced by another session. Stop other sessions to reconnect.');
          break;
        case DisconnectReason.loggedOut:
          console.log('Device logged out. Exiting...');
          break;
        case DisconnectReason.multideviceMismatch:
          console.log('Multi-device mismatch. Please rescan.');
          break;
        default:
          console.log('Unknown reason:', reason);
      }

      process.exit(1);
    }

    if (connection === 'connecting') {
      console.log('Connecting...');
    }

    if (connection === 'open') {
      console.log('Connected successfully!');
      console.log();
    }
  });

  handleMessages(sock);
  handleEvents(sock);
}

startSock();
