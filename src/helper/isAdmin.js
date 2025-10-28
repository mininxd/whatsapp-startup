/**
 * File ini berisi fungsi bantuan untuk memeriksa apakah seorang pengguna adalah admin.
 * Fungsi ini membaca daftar admin dari file config.json dan membandingkannya
 * dengan JID (Jabber ID) pengirim.
 * 
 * This file contains a helper function to check if a user is an admin.
 * It reads the admin list from the config.json file and compares it
 * with the sender's JID (Jabber ID).
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getSender } from '../helper/getSender.js';

// Mendapatkan nama file dan direktori saat ini.
// Get the current filename and directory name.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Memuat konfigurasi dari file config.json.
// Load configuration from the config.json file.
const configPath = path.join(__dirname, '../../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

/**
 * Memeriksa apakah pengirim pesan adalah admin.
 * @param {object} msg - Objek pesan.
 * @returns {boolean} - True jika admin, false jika tidak.
 * 
 * Checks if the message sender is an admin.
 * @param {object} msg - The message object.
 * @returns {boolean} - True if admin, false otherwise.
 */
export default function isAdmin(msg) {
  const sender = getSender(msg);
  const bareSender = sender.split('@')[0];
  return config.admin.includes(bareSender);
}