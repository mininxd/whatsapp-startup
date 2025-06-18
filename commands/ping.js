export default async function (sock, msg, text) {
  if (text === '.ping') {
      await sock.sendMessage(msg.key.remoteJid, { 
      text: `Ping Success!\nTry .ping-admin`});
  }
}
