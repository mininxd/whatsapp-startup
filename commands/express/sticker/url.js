import { Router } from 'express';
import axios from 'axios';
import sharp from 'sharp';

const router = Router();

/**
 * POST /miscellaneous/sticker
 * Body JSON:
 * {
 *   "jid": "628xxxx@s.whatsapp.net",
 *   "url": "https://example.com/image.png" OR base64,
 *   "packName": "My Pack",
 *   "stickerName": "Cool Sticker"
 * }
 */
router.post('/', async (req, res) => {
  const { jid, url, packName = '', stickerName = '' } = req.body;

  if (!jid || !url) {
    return res.status(400).json({ error: 'Missing "jid" or "url"' });
  }

  try {
    const sock = global.sock;
    if (!sock) throw new Error('WhatsApp not connected');

    let buffer;

    if (/^data:.*?base64,/.test(url)) {
      const base64Data = url.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      buffer = Buffer.from(response.data);
    }

    const webpBuffer = await sharp(buffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ lossless: true })
      .toBuffer();

    await sock.sendMessage(jid, {
      sticker: webpBuffer,
      mimetype: 'image/webp'
    }, {
      contextInfo: {
        externalAdReply: {
          title: stickerName,
          body: packName,
          mediaType: 2
        }
      }
});


    res.json({ success: true, to: jid, type: 'sticker', packName, stickerName });
  } catch (err) {
    console.error('[POST /sticker/url]', err);
    res.status(500).json({ error: err.message || 'Sticker send failed' });
  }
});

export default router;
