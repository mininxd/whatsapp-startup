/**
 * File ini bertanggung jawab untuk menangani pesan yang masuk.
 * Fungsinya adalah memuat semua handler perintah dari direktori 'commands',
 * membedakan antara perintah dengan dan tanpa awalan (prefix),
 * dan kemudian menjalankan handler yang sesuai berdasarkan konten pesan.
 * 
 * This file is responsible for handling incoming messages.
 * It loads all the command handlers from the 'commands' directory,
 * distinguishes between commands with and without prefixes,
 * and then executes the appropriate handler based on the message content.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { loadCommands } from '../loader.js';

// Mendapatkan nama file dan direktori saat ini.
// Get the current filename and directory name.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Memuat konfigurasi dari file config.json.
// Load configuration from the config.json file.
const configPath = path.resolve(__dirname, '../../config.json');
const config = JSON.parse(await fs.promises.readFile(configPath, 'utf-8'));
const prefixes = config.prefix;

// Memuat semua handler perintah.
// Load all command handlers.
const { prefixHandlers, noPrefixHandlers } = await loadCommands();

/**
 * Fungsi untuk mengekstrak teks dari pesan.
 * @param {object} msg - Objek pesan.
 * @returns {string} - Teks dari pesan.
 * 
 * Function to extract text from a message.
 * @param {object} msg - The message object.
 * @returns {string} - The text from the message.
 */
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

/**
 * Fungsi utama untuk menangani pesan yang masuk.
 * @param {object} sock - Instance socket WhatsApp.
 * 
 * Main function to handle incoming messages.
 * @param {object} sock - The WhatsApp socket instance.
 */
export default function handleMessages(sock) {
  sock.ev.removeAllListeners('messages.upsert');

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg?.message) return;

    // Memeriksa apakah pesan memiliki konten yang dapat diproses.
    // Check if the message has processable content.
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
    // Menjalankan handler tanpa awalan (noPrefix).
    // Run noPrefix handlers.
    // ================
    for (const handler of noPrefixHandlers) {
      try {
        await handler(sock, msg, rawText);
      } catch (e) {
        console.error('noPrefix handler failed:', e);
      }
    }

    // ================
    // Memeriksa dan menjalankan perintah dengan awalan (prefix).
    // Check for and run prefix-based commands.
    // ================
    const usedPrefix = prefixes.find(p => rawText.startsWith(p));
    if (!usedPrefix) return;

    const text = rawText.slice(usedPrefix.length).trim();
    if (!text) return;

    for (const handler of prefixHandlers) {
      try {
        await handler(sock, msg, text);
      } catch (e) {
        console.error('Prefix handler failed:', e);
      }
    }
  });
}
