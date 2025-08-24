import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

const commands = [
    "s",
    "sticker",
    "stiker"
    ]


export default async function (sock, msg) {
    const getMessageContent = (message) => {
        return message?.conversation ||
               message?.extendedTextMessage?.text ||
               message?.imageMessage?.caption ||
               message?.videoMessage?.caption ||
               message?.documentMessage?.caption ||
               '';
    };

    const text = getMessageContent(msg.message);

    if (commands.some(c => text.toLowerCase().startsWith(c))) {
        let pack, author;
        const parts = text.split(' ').slice(1);
     //   pack = parts.join(' ').split('|')[0]?.trim() || 'My Sticker';
     pack = null
     //   author = parts.join(' ').split('|')[1]?.trim() || 'My Bot';
     author = "mininxd"

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const directMsg = msg.message;

        let buffer;
        let isVideo = false;

        // Check for direct media
        if (directMsg?.imageMessage) {
            buffer = await downloadMediaMessage(msg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        } else if (directMsg?.videoMessage) {
            isVideo = true;
            buffer = await downloadMediaMessage(msg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        } else if (directMsg?.stickerMessage) {
            buffer = await downloadMediaMessage(msg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        } else if (directMsg?.documentMessage && directMsg.documentMessage.mimetype === 'image/svg+xml') {
            buffer = await downloadMediaMessage(msg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        }
        // Check for quoted media
        else if (quoted?.imageMessage) {
            buffer = await downloadMediaMessage({ message: { imageMessage: quoted.imageMessage } }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        } else if (quoted?.videoMessage) {
            isVideo = true;
            buffer = await downloadMediaMessage({ message: { videoMessage: quoted.videoMessage } }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        } else if (quoted?.stickerMessage) {
            buffer = await downloadMediaMessage({ message: { stickerMessage: quoted.stickerMessage } }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        } else if (quoted?.documentMessage && quoted.documentMessage.mimetype === 'image/svg+xml') {
            buffer = await downloadMediaMessage({ message: { documentMessage: quoted.documentMessage } }, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
        }

        if (buffer) {
            const sticker = new Sticker(buffer, {
                pack: pack,
                author: author,
                type: isVideo ? StickerTypes.FULL : StickerTypes.DEFAULT,
                quality: 50
            });

            await sock.sendMessage(msg.key.remoteJid, await sticker.toMessage());
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Send or reply to an image, video, or sticker!' });
        }
    }
}
