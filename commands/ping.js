export default async function (sock, msg, text) {
  if (text === '!ping') {
    console.log(msg, text)
    await sock.sendMessage(msg.key.remoteJid, { text: 'pong!' });
  }
}
