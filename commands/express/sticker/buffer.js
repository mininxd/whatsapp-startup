import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';

const router = Router();
const upload = multer(); // memory buffer

/**
 * POST /miscellaneous/stickerBuffer
 * FormData:
 * - jid: WhatsApp ID (e.g. 628xxxxx@s.whatsapp.net)
 * - packName: optional
 * - stickerName: optional
 * - image: (file) required
 */
router.post('/', upload.single('image'), async (req, res) => {
  const { jid, packName = '', stickerName = '' } = req.body;
  const file = req.file;

  if (!jid || !file) {
    return res.status(400).json({ error: 'Missing "jid" or image file' });
  }

  try {
    const sock = global.sock;
    if (!sock) throw new Error('WhatsApp not connected');

    const isSvg =
      file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg');

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
})

    res.json({ success: true, to: jid, type: 'sticker', name: file.originalname });
  } catch (err) {
    console.error('[POST /sticker/buffer]', err);
    res.status(500).json({ error: err.message || 'Sticker send failed' });
  }
});

export default router;
