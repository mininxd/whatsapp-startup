import sharp from 'sharp';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const commands = ["s"];

async function toWebp(imgBuffer) {
  return sharp(imgBuffer)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toFormat('webp')
    .toBuffer();
}

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    // Detect direct or replied image
    let imageMessage;

    if (msg.message?.imageMessage) {
      // Case 1: user sent .s with an image
      imageMessage = msg.message.imageMessage;
    } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        // Case 2: user replied to an image
      const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
      const imgKey = Object.keys(quoted).find(k => k.includes('imageMessage'));
      if (imgKey) imageMessage = quoted[imgKey];
    }

    if (!imageMessage) {
  await sock.sendMessage(
    msg.key.remoteJid,
    { text: 'Cek sticker.js untuk edit pesan ini, hehe' },
    { quoted: msg });
    return;
    }

    try {
      // Download image
      const stream = await downloadContentFromMessage(imageMessage, 'image');
      let imgBuffer = Buffer.from([]);
      for await (const chunk of stream) {
        imgBuffer = Buffer.concat([imgBuffer, chunk]);
      }

      // Convert to webp
      const webp = await toWebp(imgBuffer);

      // Send as sticker
      await sock.sendMessage(
        msg.key.remoteJid,
        { sticker: webp },
        { quoted: msg }
      );
    } catch (e) {
      console.error('Error creating sticker:', e);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '',
      });
    }
  }
}
