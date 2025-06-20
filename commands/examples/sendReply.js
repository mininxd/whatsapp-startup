const commands = [
  "quoted",
  "reply"
];

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: 'This is a quoted reply!',
    }, { quoted: msg });
  }
}
