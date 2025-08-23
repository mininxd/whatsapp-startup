const commands = [
    "delete",
    "del"
];

export default async function (sock, msg, text) {
    if (commands.includes(text)) {
        if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            await sock.sendMessage(msg.key.remoteJid, { text: "Please quote a message to delete." });
            return;
        }

        const key = {
            remoteJid: msg.key.remoteJid,
            fromMe: msg.message.extendedTextMessage.contextInfo.participant === sock.user.id.split(":")[0] + "@s.whatsapp.net",
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant: msg.message.extendedTextMessage.contextInfo.participant
        }

        if (!key.fromMe) {
            const myMessage = await sock.sendMessage(msg.key.remoteJid, { text: "I can only delete my own messages" });
            setTimeout(async () => {
                await sock.sendMessage(msg.key.remoteJid, { delete: myMessage.key });
            }, 5000);
            return;
        }

        await sock.sendMessage(msg.key.remoteJid, {
            delete: key
        });
    }
}
