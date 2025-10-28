/**
 * File ini berisi fungsi bantuan untuk mendapatkan JID (Jabber ID) pengirim
 * dari sebuah objek pesan.
 * 
 * This file contains a helper function to get the sender's JID (Jabber ID)
 * from a message object.
 */

/**
 * Mendapatkan JID pengirim dari pesan.
 * @param {object} msg - Objek pesan.
 * @returns {string|null} - JID pengirim, atau null jika tidak ditemukan.
 * 
 * Gets the sender's JID from a message.
 * @param {object} msg - The message object.
 * @returns {string|null} - The sender's JID, or null if not found.
 */
export function getSender(msg) {
  const jid = msg?.key?.participant || msg?.key?.remoteJid;
  return jid ? jid.split('@')[0] : null;
}
