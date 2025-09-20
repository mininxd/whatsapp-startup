import { Router } from 'express';

const router = Router();

// GET /test
router.get('/', (req, res) => {
  res.send('✅ Hello from Express test route!');
});

// POST /test
router.post('/', async (req, res) => {
  const { jid, text } = req.body;

  if (!jid || !text) {
    return res.status(400).json({ error: 'Missing "jid" or "text" in body' });
  }

  try {
    const sock = global.sock;
    if (!sock) throw new Error('WhatsApp socket not initialized');

    await sock.sendMessage(jid, { text });
    res.json({ success: true, to: jid, message: text });
  } catch (err) {
    console.error('[Express /test]', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

export default router;
