export default async function (sock, socket, data) {
  const { jid, text } = data;
  if (!jid || !text) throw new Error('Missing jid or text');

  await sock.sendMessage(jid, { text });
}
