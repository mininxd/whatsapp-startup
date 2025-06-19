import { Boom } from "@hapi/boom";
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


// try it, and contribute ;)
// cleanSession();


const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = baileys;
const pino = P({
  level: process.env.LEVEL || "silent"
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFolder = path.join(__dirname, '..', 'auth');
const credsFile = path.join(authFolder, 'creds.json');

let pairing = false;
async function startSock(restart = false) {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  // Asks for the connection method if it is not logged in.
  if (!credsFile) {
    console.log("1", "Scan QR");
    console.log("2", "Pairing code");
    console.log("0", "Exit");
    const select = await input.select("Select one", [
      {
        name: "Scan QR",
        value: 1
      },
      {
        name: "Pairing code",
        value: 2
      },
      {
        name: "Exit",
        value: 0
      }
    ], {
      default: 1
    });
    pairing = select === 2;
    if (select === 0) {
      console.log("Canceled! Exiting...");
      process.exit(0);
    }
  }

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: baileys.makeCacheableSignalKeyStore(state.keys, pino)
    },
    logger: pino,
    getMessage: null, // todo
     browser: baileys.Browsers.windows("Chrome")
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr, receivedPendingNotifications }) => {
    if (receivedPendingNotifications) {
      sock.ev.flush();
    }

    if (qr) {
      if (!pairing) {
        qrcode.generate(qr, { small: true });
        console.log("Open WhatsApp, then click the three dots > Linked devices > Link a device > Then scan the QR code above.");
      } else {
        // Remove console logs and set pino level to silent to avoid overwriting input text
        const {
          log,
          warn,
          error
        } = console;
        console.log = console.warn = console.error = () => { };
        pino.level = "silent";

        // Showing prompt for phone number
         const phone = ph(await input.text("Phone number (Use country code):", {
           validate(input) {
            // Validate phone number
            if (!input) return "Phone number is required!";
            if (!ph(input)?.g?.number?.e164) return "Invalid number! Make sure you use the country code.";
            return true;
          }
        })).g.number.e164.slice(1);

        // Restore console logs and set pino level back to original
        console.log = log;
        console.warn = warn;
        console.error = error;
        pino.level = process.env.LEVEL || "silent";

        // Request pairing code
        const code = await sock.requestPairingCode(phone);
        console.log("Click the notification that appears on your Android/iOS device (where WhatsApp is installed).");
        console.log("If no notification appears, open WhatsApp, then click the three dots > Linked devices > Link a device > Link with phone number instead, and enter the following pairing code:");
        console.log("[PAIRING] Code:", code?.match(/.{1,4}/g)?.join("-") || code);
      }
    }
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;

      if (reason === baileys.DisconnectReason.badSession) {
        console.log("The session file is corrupt, delete the session file and rescan.");
        process.exit(1);
      } else if (reason === baileys.DisconnectReason.connectionClosed) {
        console.log("Connection closed, reconnecting...");
        await startSock(true);
      } else if (reason === baileys.DisconnectReason.connectionLost) {
        console.log("Connection from server lost, reconnecting...");
        await startSock(true);
      } else if (reason === baileys.DisconnectReason.connectionReplaced) {
        console.log("The connection was replaced by another script, stop that script to reconnecting.");
        process.exit(1);
      } else if (reason === baileys.DisconnectReason.loggedOut) {
        console.log("Device is logged out, stopping...");
        process.exit(1);
      } else if (reason === baileys.DisconnectReason.restartRequired) {
        console.log("Requires restart, reconnecting...");
        await startSock(true);
      } else if (reason === baileys.DisconnectReason.timedOut) {
        console.log("Connection timed out, reconnecting...");
        await startSock(true);
      } else if (reason === baileys.DisconnectReason.multideviceMismatch) {
        console.log("Multi device incompatibility, please rescan.");
        process.exit(1);
      } else {
        console.log(reason);
        process.exit(1);
      }
    }

    if (connection === "connecting") {
      console.log("Connecting...");
    }

    if (connection === "open") {
      console.log("Connected successfully!");
//      console.log(`WhatsApp JID: ${sock.user.id}`);
//      console.log(`WhatsApp LID: ${sock.user.lid || "N/A"}`);
//      console.log(`WhatsApp Name: ${sock.user.name || sock.user.verifiedName || "N/A"}`);
      console.log();
    }
  });

  handleMessages(sock);
  handleEvents(sock);
}

startSock();
