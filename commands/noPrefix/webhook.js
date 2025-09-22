import axios from "axios";

export default async function (sock, msg, text) {
  const jid = msg.key.remoteJid;
  const fromMe = msg.key.fromMe;
  
  // only accept normal chats
  if (!fromMe && !jid.includes("status@broadcast")) {
  const { data } = await axios.post('http://localhost:5678/webhook/whatsapp', {
    jid: msg.key.remoteJid,
    message: text
  });
  console.log(data);
  }
}
