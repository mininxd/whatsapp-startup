# WhatsApp Bot Starter

A minimal, scalable WhatsApp bot using [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys).  
Built for clean structure, easy commands, and rapid prototyping.

---

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the bot**
   ```bash
   node index.js
   ```

3. **Select Connection Type**
   - On your first run, a prompt will appear in your terminal.
   - Select the connection type using the up/down arrow keys, or enter the corresponding number.
   - After selecting the connection type (either pairing or QR), follow the instructions displayed in the terminal.
   - Session data is saved in `/auth/`, so you won't need to scan again next time.

---

## Adding Commands

- To add a **user command**, create a `.js` in `/commands/`.
- To add an **admin command**, put it in `/commands/admin/`

**Example: `commands/ping.js`**
```js
export default async function (sock, msg, text) {
  if (text === '!ping') {
    await sock.sendMessage(msg.key.remoteJid, { text: 'pong!' });
  }
}
```

---

## Best Practices

- Never commit your `/auth/` folder to public repos.
- Check for admin roles inside each admin command.
- Use environment variables or a config for secrets.
- Deploy on a secure server or VPS.

---

## Credits

- [Baileys](https://github.com/WhiskeySockets/Baileys) powerful WhatsApp Web API.
- [QRCode Terminal](https://www.npmjs.com/package/qrcode-terminal) show QR in terminal.

---
