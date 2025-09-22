import { Router } from 'express';
import axios from 'axios';
import sharp from 'sharp';

const router = Router();

/**
 * POST /miscellaneous/imageBuffer
 * FormData:
 * - jid: WhatsApp ID (example: 6289xxxxx@s.whatsapp.net)
 * - url: (image url / base64)
 * - caption: (optional)
 */

router.post('/', async (req, res) => {
  const { jid, url, caption } = req.body;

  if (!jid || !url) {
    return res.status(400).json({ error: 'Missing "jid" or "url"' });
  }

  try {
    const sock = global.sock;
    if (!sock) throw new Error('WhatsApp not connected');

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'];
    let buffer = Buffer.from(response.data);

    // Convert SVG to PNG using sharp
    if (
      contentType === 'image/svg+xml' ||
      url.toLowerCase().endsWith('.svg')
    ) {
      buffer = await sharp(buffer).png().toBuffer();
    }

    await sock.sendMessage(jid, {
      image: buffer,
      caption: caption || '',
      mimetype: 'image/jpeg'
    });

    res.json({ success: true, to: jid });
  } catch (err) {
    console.error('[POST /images/url]', err);
    res.status(500).json({ error: err.message || 'Send failed' });
  }
});

export default router;
