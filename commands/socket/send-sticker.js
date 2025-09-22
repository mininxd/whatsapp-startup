/**
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {import('socket.io').Socket} socket
 * @param {object} data
 * @param {string} data.jid
 * @param {string} data.url
 */
export default async function (sock, socket, data) {
  const { jid, url } = data;
  if (!jid || !url) throw new Error('Missing jid or url');

  await sock.sendMessage(jid, {
    sticker: { url },
  });
}
