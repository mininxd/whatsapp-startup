import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default async function (sock, msg) {
  const conversation = msg.message?.conversation;
  const extendedText = msg.message?.extendedTextMessage?.text;
  const imageCaption = msg.message?.imageMessage?.caption;

  const text = conversation || extendedText || imageCaption || '';

  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  const direct = msg.message?.imageMessage;


//.s or .sticker
  if (text === '.s' || text === '.sticker') {
    // if replied
    if (quoted) {
      const buffer = await downloadMediaMessage(
        { message: { imageMessage: quoted } },
        'buffer',
        {},
        { reuploadRequest: sock.updateMediaMessage }
      );
      await sock.sendMessage(msg.key.remoteJid, {
        sticker: buffer,
      });
    // if direct ".s" with image
    } else if (direct) {
      const buffer = await downloadMediaMessage(
        msg,
        'buffer',
        {},
        { reuploadRequest: sock.updateMediaMessage }
      );
      await sock.sendMessage(msg.key.remoteJid, {
        sticker: buffer,
      })
      // else no image, send as text
    } else {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Send or reply image!' });
    }
  }
}
