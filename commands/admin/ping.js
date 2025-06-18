import isAdmin from '../../src/helper/isAdmin.js';

export default async function (sock, msg, text) {
  if(text === ".ping-admin") {
  if (isAdmin(msg)) {
    await sock.sendMessage(msg.key.remoteJid, { text: 'Admin Configured Successfully!' });
  } else {
    await sock.sendMessage(msg.key.remoteJid, { 
      text: 'Admin not configured!\nTry configure admin number in config.json, including country code without +' });
    }
  }
}
