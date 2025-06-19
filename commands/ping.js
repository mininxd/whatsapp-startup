export default async function (sock, msg, text) {
// detect user command
  if (text === '.ping') {
    //simple code for send text "Pong"
      await sock.sendMessage(msg.key.remoteJid, { 
      text: `Pong`});
  }
}
