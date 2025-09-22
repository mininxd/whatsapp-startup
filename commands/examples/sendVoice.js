import fs from 'fs';

const commands = [
  "sendTTS"
];

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    const ttsAudioBuffer = fs.readFileSync('./path/to/tts-audio.mp3');

    await sock.sendMessage(msg.key.remoteJid, {
      audio: ttsAudioBuffer,
      mimetype: 'audio/mpeg',
      ptt: true
    });
  }
}
