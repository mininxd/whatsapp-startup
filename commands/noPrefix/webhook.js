import axios from "axios";

export default async function (sock, msg, text) {
  const fromMe = msg.key.fromMe;

  if (!fromMe) {
  const { data } = await axios.post('http://localhost:5678/webhook/whatsapp', {
    jid: msg.key.remoteJid,
    message: text
  });
  console.log(data);
  }
}
