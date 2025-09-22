/**
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {import('socket.io').Socket} socket
 * @param {object} data
 * @param {string} data.jid
 * @param {string} data.text
 */
export default async function (sock, socket, data) {
  const { jid, text } = data;
  if (!jid || !text) throw new Error('Missing jid or text');

  await sock.sendMessage(jid, { text });
}
