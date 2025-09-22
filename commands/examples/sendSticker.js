import fs from 'fs';

const commands = [
  "sendSticker"
];

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    const stickerBuffer = fs.readFileSync('./path/to/sticker.webp');

    await sock.sendMessage(msg.key.remoteJid, {
      sticker: stickerBuffer
    });
  }
}
