const commands = [
  "react"
];

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    await sock.sendMessage(msg.key.remoteJid, {
      react: {
        text: '👀',
        key: msg.key
      }
    });
  }
}
