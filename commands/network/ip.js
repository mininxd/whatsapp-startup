import axios from "axios";

const commands = [
  "ip",
  "iplookup"
];

export default async function (sock, msg, text) {
  const [cmd, ...input] = text.trim().split(/\s+/);

  if (commands.includes(cmd)) {
    async function getIP(ip) {
      try {
        const { data } = await axios.get(`https://api-mininxd.vercel.app/ip/${ip}`);
        return data;
      } catch (e) {
        return "error";
      }
    }

    const ipData = await getIP(input[0] || "");

    await sock.sendMessage(msg.key.remoteJid, {
      text: JSON.stringify(ipData, null, 2)
    });
  }
}
