import fs from 'fs';

const commands = [
  "video"
];

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    const videoBuffer = fs.readFileSync('./path/to/video.mp4');

    await sock.sendMessage(msg.key.remoteJid, {
      video: videoBuffer,
      caption: 'Here is your video!',
      mimetype: 'video/mp4' 
    });
  }
}
