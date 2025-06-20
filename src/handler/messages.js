import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, '../../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const prefixes = config.prefix;

const commandsDir = path.join(__dirname, '../../commands');

function getAllCommandFiles(dir) {
  let files = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllCommandFiles(fullPath));
    } else if (file.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

const handlers = [];
for (const file of getAllCommandFiles(commandsDir)) {
  const { default: handler } = await import(file);
  handlers.push(handler);
}

function extractText(msg) {
  if (msg.message.conversation) return msg.message.conversation;
  if (msg.message.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
  if (msg.message.imageMessage?.caption) return msg.message.imageMessage.caption;
  if (msg.message.videoMessage?.caption) return msg.message.videoMessage.caption;
  if (msg.message.documentMessage?.caption) return msg.message.documentMessage.caption;
  if (msg.message.buttonsResponseMessage?.selectedButtonId) return msg.message.buttonsResponseMessage.selectedButtonId;
  if (msg.message.listResponseMessage?.singleSelectReply?.selectedRowId) return msg.message.listResponseMessage.singleSelectReply.selectedRowId;
  return '';
}

export default function handleMessages(sock) {
  sock.ev.removeAllListeners('messages.upsert');

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    const isMessages = !!(
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

    if (!isMessages) return;

    let rawText = extractText(msg);
    if (typeof rawText !== 'string' || rawText.length === 0) return;

    const usedPrefix = prefixes.find(p => rawText.startsWith(p));
    if (!usedPrefix) return;

    const text = rawText.slice(usedPrefix.length).trim();

    for (const handler of handlers) {
      await handler(sock, msg, text);
    }
  });
}
