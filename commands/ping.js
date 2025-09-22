const commands = [
    "ping"
    ]

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: 'Pong!'
    });
  }
}
