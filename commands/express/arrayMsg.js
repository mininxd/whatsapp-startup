// this command send splitted array messages with delay for prevent spam detection
// ["message1", "message2", ...] or single raw text

import { Router } from 'express';
const router = Router();

router.post('/', async (req, res) => {
  const { jid, messages } = req.body;

  try {
    const sock = global.sock;
    if (!sock) throw new Error('WhatsApp socket not initialized');

    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getRandomDelay(min = 500, max = 1000) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    let parsedMessages = messages;

    // Ensure it's properly parsed if sent as a JSON string
    if (typeof messages === 'string') {
      try {
        const temp = JSON.parse(messages);
        parsedMessages = temp;
      } catch {
        parsedMessages = messages;
      }
    }

    // Handle array or single string
    if (Array.isArray(parsedMessages)) {
      for (let i = 0; i < parsedMessages.length; i++) {
        await sock.sendMessage(jid, { text: parsedMessages[i] });
        const randomTime = getRandomDelay(500, 1000);
        console.log(`Waiting ${randomTime}ms before next message...`);
        await delay(randomTime);
      }
    } else {
      await sock.sendMessage(jid, { text: parsedMessages });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[Express /arrayMsg]', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

export default router;