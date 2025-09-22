const commands = [
  "multipleImages",
  "multiImages",
  "multiImg"
];

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    await sock.sendMessage(msg.key.remoteJid, {
      media: [
        { image: { url: 'https://example.com/image1.jpg' }, caption: 'Image 1' },
        { image: { url: 'https://example.com/image2.jpg' }, caption: 'Image 2' }
      ]
    });
  }
}
