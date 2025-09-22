const commands = [
  "image",
  "img"
];

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    await sock.sendMessage(msg.key.remoteJid, {
      image: { url: 'https://example.com/your-image.jpg' },
      caption: 'Here is an image from URL!'
    });
  }
}
