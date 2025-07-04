import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';

const router = Router();
const upload = multer(); // memory storage

/**
 * POST /miscellaneous/imageBuffer
 * FormData:
 * - jid: WhatsApp ID (example: 6289xxxxx@s.whatsapp.net)
 * - caption: (optional)
 * - image: (file)
 */
router.post('/', upload.single('image'), async (req, res) => {
  const { jid, caption } = req.body;
  const file = req.file;

  if (!jid || !file) {
    return res.status(400).json({ error: 'Missing "jid" or image file' });
  }

  try {
    const sock = global.sock;
    if (!sock) throw new Error('WhatsApp not connected');

    const isSvg =
      file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg');

    let buffer = file.buffer;

    if (isSvg) {
      buffer = await sharp(buffer).png().toBuffer();
    }

    await sock.sendMessage(jid, {
      image: buffer,
      caption: caption || '',
      mimetype: 'image/jpeg'
    });

    res.json({ success: true, to: jid, file: file.originalname });
  } catch (err) {
    console.error('[POST /images/buffer]', err);
    res.status(500).json({ error: err.message || 'Send failed' });
  }
});

export default router;
