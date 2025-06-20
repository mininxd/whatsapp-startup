// helper: isAdmin returns true or false
import isAdmin from '../../src/helper/isAdmin.js';
// helper: getSender returns the sender's number (000000@s.whatsapp.net)
import { getSender } from '../../src/helper/getSender.js';

// command list
const commands = [
    "ping-admin",
    "pingadmin",
    "testadmin"
    ]

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    // get actual number by removing @s.whatsapp.net
    const number = getSender(msg).split('@')[0];
    
    //if admin = true
    if (isAdmin(msg)) {
      // React if admin configured
      await sock.sendMessage(msg.key.remoteJid, {
        react: {
          text: '🚀',
          key: msg.key
        }
      });
      // after send react, do send message
      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ Admin Configured Successfully!\n\nKeep exploring with Baileys 🚀`
      });

    } else {
      // Send instructions if admin not configured
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ *Admin not configured!*\n\nPlease add your number to *config.json*.\nInclude your country code *without +*.\n\nExample:\n${number} *(your number)*`
      });
    }
  }
}
