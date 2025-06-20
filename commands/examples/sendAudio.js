import fs from 'fs';

const commands = [
  "audio"
];

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    const audioBuffer = fs.readFileSync('./path/to/audio.mp3');

    await sock.sendMessage(msg.key.remoteJid, {
      audio: audioBuffer,
      mimetype: 'audio/mpeg'
    });
  }
}
