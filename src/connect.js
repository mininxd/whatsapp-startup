/**
 * File ini adalah inti dari aplikasi.
 * Fungsinya untuk menangani koneksi ke WhatsApp, termasuk otentikasi,
 * pembuatan kode QR, dan rekoneksi otomatis.
 * File ini juga mengimpor handler untuk pesan dan event.
 * 
 * This file is the core of the application.
 * It handles the connection to WhatsApp, including authentication,
 * QR code generation, and automatic reconnection.
 * It also imports the message and event handlers.
 */

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

// Opsi untuk logging yang lebih detail.
// Option for more detailed logging.
const verbose = process.argv.includes('-v');
const pino = P({ level: verbose ? 'info' : 'silent' });

// Mendapatkan nama file dan direktori saat ini.
// Get the current filename and directory name.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Menentukan folder untuk menyimpan data otentikasi.
// Specify the folder to store authentication data.
const authFolder = path.join(__dirname, '..', 'auth');
const credsFile = path.join(authFolder, 'creds.json');

// Variabel untuk mode pairing dan delay rekoneksi.
// Variables for pairing mode and reconnect delay.
let pairing = false;
let reconnectDelay = 3000; // Delay awal: 3 detik. Initial delay: 3 seconds.

/**
 * Fungsi utama untuk memulai koneksi socket.
 * 
 * Main function to start the socket connection.
 */
async function startSock() {
  // Loop tak terbatas untuk rekoneksi.
  // Infinite loop for reconnection.
  while (true) {
    try {
      // Menggunakan otentikasi multi-file.
      // Use multi-file authentication.
      const { state, saveCreds } = await useMultiFileAuthState(authFolder);

      // Meminta input pengguna jika file kredensial tidak ada.
      // Ask for user input if the credentials file does not exist.
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

      // Membuat instance socket WhatsApp.
      // Create a WhatsApp socket instance.
      const sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino)
        },
        logger: pino,
        getMessage: null,
        browser: Browsers.windows('Chrome')
      });

      // Menyimpan kredensial setiap kali ada pembaruan.
      // Save credentials on every update.
      sock.ev.on('creds.update', saveCreds);

      // Mengirim pembaruan status 'available' secara berkala.
      // Periodically send 'available' presence update.
      const keepAliveInterval = setInterval(async () => {
        try { await sock.sendPresenceUpdate('available'); }
        catch (e) { console.log('Keep-alive failed:', e.message || e); }
      }, 600000);

      // Menangani pembaruan status koneksi.
      // Handle connection status updates.
      sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr, receivedPendingNotifications }) => {
        if (receivedPendingNotifications) sock.ev.flush();

        // Menampilkan kode QR jika belum terhubung.
        // Display QR code if not connected.
        if (qr && !pairing) {
          qrcode.generate(qr, { small: true });
          console.log('Scan QR in WhatsApp > Linked devices > Link a device.');
        }

        // Menangani mode pairing.
        // Handle pairing mode.
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

        // Menangani saat koneksi ditutup.
        // Handle when the connection is closed.
        if (connection === 'close') {
          clearInterval(keepAliveInterval);
          const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
          console.log('Disconnected. Reason:', reason);

          switch (reason) {
            case DisconnectReason.badSession:
            case 428: // Precondition Required
              console.log('Bad session or precondition failed, cleaning...');
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

          // Menunggu sebelum mencoba rekoneksi.
          // Wait before attempting to reconnect.
          await new Promise(resolve => setTimeout(resolve, reconnectDelay));
          reconnectDelay = Math.min(reconnectDelay * 2, 60000); // Exponential backoff
        }

        if (connection === 'connecting') console.log('Connecting...');
        if (connection === 'open') {
          console.log('Connected successfully!\n');
          reconnectDelay = 3000; // Mereset delay saat koneksi berhasil. Reset delay on successful connection.
        }
      });

      // Menangani pesan dan event.
      // Handle messages and events.
      handleMessages(sock);
      handleEvents(sock);

      // Menunggu hingga koneksi socket ditutup, lalu mencoba lagi.
      // Wait until the socket connection is closed, then retry.
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

// Memulai koneksi socket.
// Start the socket connection.
startSock();
