/**
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {import('socket.io').Socket} socket
 * @param {object} data
 * @param {string} data.jid
 * @param {string} data.text
 * @param {string} data.key.remoteJid
 * @param {string} data.key.id
 * @param {string} data.key.participant
 */
export default async function (sock, socket, data) {
  const { jid, text, key } = data;
  if (!jid || !text || !key) throw new Error('Missing jid, text, or key');

  await sock.sendMessage(jid, {
    react: {
      text,
      key,
    },
  });
}
