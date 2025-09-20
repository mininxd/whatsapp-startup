import { getSender, isAdmin } from '../helper/index.js';
import config from '../../config.json' assert { type: 'json' };

export default async function message(sock, m) {
  const { from, sender, body, isGroup, groupMetadata } = await getSender(sock, m);
  const { pushName, verifiedName } = m.messages[0];
  const { admin, prefix } = config;

  const isOwner = admin.includes(sender);
  const isCmd = body.startsWith(prefix);

  // Log incoming message
  console.log(
    `[${isGroup ? 'GROUP' : 'PRIVATE'}] ${new Date().toLocaleTimeString()} ` +
    `(${isGroup ? groupMetadata.subject : pushName || verifiedName}) ` +
    `${sender}: ${body}`
  );

  // Here you can add your command handling logic
  if (isCmd) {
    const command = body.slice(1).trim().split(/ +/).shift().toLowerCase();
    const args = body.trim().split(/ +/).slice(1);
    const text = args.join(' ');

    console.log(`[COMMAND] ${command} from ${sender} with args: ${text}`);
    // Example command
    if (command === 'ping') {
      await sock.sendMessage(from, { text: 'Pong!' }, { quoted: m.messages[0] });
    }
  } else {
    // Echo functionality
    await sock.sendMessage(from, { text: body }, { quoted: m.messages[0] });
  }
}
