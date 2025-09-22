import fs from 'fs';

const commands = [
  "imageBuffer",
  "imgBuffer"
];

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    const imageBuffer = fs.readFileSync('./path/to/image.jpg');
    await sock.sendMessage(msg.key.remoteJid, {
      image: imageBuffer,
      caption: 'Here is your image!'
    });
  }
}
