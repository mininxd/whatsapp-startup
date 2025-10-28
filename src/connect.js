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
let reconnectDelay = 3000; // Initial delay: 3 seconds

async function startSock() {
  while (true) { // Infinite reconnect loop
    try {
      const { state, saveCreds } = await useMultiFileAuthState(authFolder);

      // Ask user if no creds
      if (!fs.existsSync(credsFile)) {
        const select = await input.select('Select one', [
          { name: 'Scan QR', value: 1 },
          { name: 'Pairing code', value: 2 },
          { name: 'Exit', value: 0 }
        ], { default: 1 });

        pairing = select === 2;
        if (select === 0) process.exit(0);
      } else {
        pairing = false;
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
        try { await sock.sendPresenceUpdate('available'); }
        catch (e) { console.log('Keep-alive failed:', e.message || e); }
      }, 600000);

      sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr, receivedPendingNotifications }) => {
        if (receivedPendingNotifications) sock.ev.flush();

        if (qr && !pairing) {
          qrcode.generate(qr, { small: true });
          console.log('Scan QR in WhatsApp > Linked devices > Link a device.');
        }

        if (qr && pairing) {
          const { log, warn, error } = console;
          console.log = console.warn = console.error = () => {};
          pino.level = 'silent';

          const phoneInput = await input.text('Phone number (with country code):', {
            validate(input) {
              if (!input) return 'Phone number required!';
              if (!ph(input)?.g?.number?.e164) return 'Invalid number! Include country code.';
              return true;
            }
          });

          const phone = ph(phoneInput).g.number.e164.slice(1);

          console.log = log; console.warn = warn; console.error = error;

          const code = await sock.requestPairingCode(phone);
          console.log('Click the notification on your device, or enter this code:');
          console.log('[PAIRING]', code?.match(/.{1,4}/g)?.join('-') || code);
        }

        if (connection === 'close') {
          clearInterval(keepAliveInterval);
          const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
          console.log('Disconnected. Reason:', reason);

          switch (reason) {
            case DisconnectReason.badSession:
              console.log('Bad session, cleaning...');
              cleanSession();
              break;

            case DisconnectReason.connectionClosed:
            case DisconnectReason.connectionLost:
            case DisconnectReason.restartRequired:
            case DisconnectReason.timedOut:
            case 408: // Request Timeout
            case 428: // Precondition Required
            case 440: // Login Timeout
            case 503: // Service Unavailable
            case DisconnectReason.connectionReplaced:
            case DisconnectReason.multideviceMismatch:
              console.log(`Reconnecting in ${reconnectDelay / 1000}s...`);
              break;

            case DisconnectReason.loggedOut:
              console.log('Device logged out. Cleaning session...');
              cleanSession();
              break;

            default:
              console.log('Unknown reason. Retrying...');
          }

          await new Promise(resolve => setTimeout(resolve, reconnectDelay));
          reconnectDelay = Math.min(reconnectDelay * 2, 60000); // Exponential backoff
        }

        if (connection === 'connecting') console.log('Connecting...');
        if (connection === 'open') {
          console.log('Connected successfully!\n');
          reconnectDelay = 3000; // Reset delay on successful connection
        }
      });

      handleMessages(sock);
      handleEvents(sock);

      // Wait until socket closes, then loop retries automatically
      await new Promise(resolve => sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'close') resolve();
      }));

    } catch (err) {
      console.error('Unexpected error:', err);
      console.log(`Restarting socket in ${reconnectDelay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, reconnectDelay));
      reconnectDelay = Math.min(reconnectDelay * 2, 60000); // Exponential backoff
    }
  }
}

startSock();
