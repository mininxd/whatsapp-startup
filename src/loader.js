/**
 * File ini bertanggung jawab untuk memuat semua handler perintah dari direktori 'commands'.
 * 
 * This file is responsible for loading all the command handlers from the 'commands' directory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mendapatkan nama file dan direktori saat ini.
// Get the current filename and directory name.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Menentukan direktori untuk perintah.
// Specify the directories for commands.
const commandsDir = path.resolve(__dirname, '../commands');
const noPrefixDir = path.join(commandsDir, 'noPrefix');

/**
 * Fungsi untuk mencari semua file perintah secara rekursif.
 * @param {string} dir - Direktori yang akan dicari.
 * @returns {Promise<string[]>} - Daftar path file perintah.
 * 
 * Function to recursively find all command files.
 * @param {string} dir - The directory to search.
 * @returns {Promise<string[]>} - A list of command file paths.
 */
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

/**
 * Memuat semua handler perintah.
 * @returns {Promise<{prefixHandlers: function[], noPrefixHandlers: function[]}>} - Objek yang berisi handler perintah.
 * 
 * Loads all command handlers.
 * @returns {Promise<{prefixHandlers: function[], noPrefixHandlers: function[]}>} - An object containing the command handlers.
 */
export async function loadCommands() {
  const prefixHandlers = [];
  const noPrefixHandlers = [];

  // Memuat perintah dengan awalan (prefix).
  // Load commands with prefixes.
  for (const file of await getAllCommandFiles(commandsDir)) {
    if (file.includes('/noPrefix/')) continue; // Lewati folder noPrefix. Skip the noPrefix folder.
    const { default: handler } = await import(file);
    prefixHandlers.push(handler);
  }

  // Memuat perintah tanpa awalan (noPrefix).
  // Load commands without prefixes.
  for (const file of await getAllCommandFiles(noPrefixDir)) {
    const { default: handler } = await import(file);
    noPrefixHandlers.push(handler);
  }

  return { prefixHandlers, noPrefixHandlers };
}
