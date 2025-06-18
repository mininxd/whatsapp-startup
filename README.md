# WhatsApp Bot Starter

A minimal, scalable WhatsApp bot using [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys).  
Built for clean structure, easy commands, and rapid prototyping.

---

## Project Structure

```
/index.js              # Entry point
/src/
  connect.js           # Connects to WhatsApp & sets up events
  handlers/
    messages.js        # Handles incoming messages & runs all commands
/commands/
  ping.js              # Example user command (!ping)
  /admin               
/auth/                 # Stores your WhatsApp session (DO NOT SHARE!)
```

---

## How It Works

 **1. `connect.js`**

- Connects to WhatsApp using Baileys.
- Handles QR code generation.
- Listens for connection updates.
- Loads message handler.

**2. `handlers/messages.js`**

- Recursively loads **all** `.js` files in `/commands` and subfolders.
- When a message arrives, runs **all commands** in order.
- Each command decides on its own if it should act.

**3. `/commands/`**

- Each command file checks `if (text === '!yourcommand')` or regex.
- Each file exports a single `default` async function.
- Admin-only commands can check permissions inside their file.

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

3. **Scan the QR code**
   - The first time, a QR will show in your terminal.
   - Scan it with your phone to link WhatsApp.
   - Session data is saved in `/auth/` so you don't need to scan again next time.

---

## Adding Commands

- To add a **user command**, create a `.js` in `/commands/`.
- To add an **admin command**, put it in `/commands/admin/` (optional).

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
