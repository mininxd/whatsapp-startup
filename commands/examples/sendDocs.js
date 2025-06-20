import fs from 'fs';

const commands = [
  "docunent",
  "doc"
];

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    const docBuffer = fs.readFileSync('./path/to/yourfile.pdf');

    await sock.sendMessage(msg.key.remoteJid, {
      document: docBuffer,
      fileName: 'yourfile.pdf',
      mimetype: 'application/pdf' 
      // 'application/pdf' - PDF document
      // 'image/jpeg'      - JPEG image
      // 'image/png'       - PNG image
      // 'video/mp4'       - MP4 video
      // 'audio/mpeg'      - MP3 audio
      // 'text/plain'      - Plain text file
      // 'application/zip' - ZIP archive
      // https://mimetype.io/all-types
    });
  }
}
