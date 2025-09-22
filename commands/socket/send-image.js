/**
 * @param {import('@whiskeysockets/baileys').WASocket} sock
 * @param {import('socket.io').Socket} socket
 * @param {object} data
 * @param {string} data.jid
 * @param {string} data.url
 * @param {string} data.caption
 */
export default async function (sock, socket, data) {
  const { jid, url, caption } = data;
  if (!jid || !url) throw new Error('Missing jid or url');

  await sock.sendMessage(jid, {
    image: { url },
    caption,
  });
}
