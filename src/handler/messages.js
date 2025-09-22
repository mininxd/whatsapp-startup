import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '../../config.json');
const config = JSON.parse(await fs.promises.readFile(configPath, 'utf-8'));
const prefixes = config.prefix;

const commandsDir = path.resolve(__dirname, '../../commands');
const noPrefixDir = path.join(commandsDir, 'noPrefix');

// Recursive file finder
async function getAllCommandFiles(dir) {
  const files = await fs.promises.readdir(dir);
  const all = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = await fs.promises.stat(fullPath);

    if (stat.isDirectory()) {
      all.push(...await getAllCommandFiles(fullPath));
    } else if (file.endsWith('.js')) {
      all.push(fullPath);
    }
  }
  return all;
}

// Load handlers
const prefixHandlers = [];
const noPrefixHandlers = [];

// Load normal prefix commands
for (const file of await getAllCommandFiles(commandsDir)) {
  if (file.includes('/noPrefix/')) continue; // Skip noPrefix folder
  const { default: handler } = await import(file);
  prefixHandlers.push(handler);
}

// Load noPrefix commands
for (const file of await getAllCommandFiles(noPrefixDir)) {
  const { default: handler } = await import(file);
  noPrefixHandlers.push(handler);
}

// Extract text from message
function extractText(msg) {
  const m = msg?.message || {};
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  );
}

export default function handleMessages(sock) {
  sock.ev.removeAllListeners('messages.upsert');

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    const hasMessageContent = Boolean(
      msg.message.conversation ||
      msg.message.extendedTextMessage ||
      msg.message.imageMessage ||
      msg.message.videoMessage ||
      msg.message.audioMessage ||
      msg.message.stickerMessage ||
      msg.message.documentMessage ||
      msg.message.contactMessage ||
      msg.message.contactsArrayMessage ||
      msg.message.locationMessage ||
      msg.message.liveLocationMessage ||
      msg.message.productMessage ||
      msg.message.templateButtonReplyMessage ||
      msg.message.buttonsResponseMessage ||
      msg.message.listResponseMessage
    );

    if (!hasMessageContent) return;

    const rawText = extractText(msg);
    if (!rawText || typeof rawText !== 'string') return;

    // ================
    // Run noPrefix handlers (always run)
    // ================
    for (const handler of noPrefixHandlers) {
      await handler(sock, msg, rawText);
    }

    // ================
    // Then check for prefix-based commands
    // ================
    const usedPrefix = prefixes.find(p => rawText.startsWith(p));
    if (!usedPrefix) return;

    const text = rawText.slice(usedPrefix.length).trim();
    if (!text) return;

    for (const handler of prefixHandlers) {
      await handler(sock, msg, text);
    }
  });
}