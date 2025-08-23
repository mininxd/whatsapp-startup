const commands = [
    "forward",
    "fwd"
];

export default async function (sock, msg, text) {
    if (commands.includes(text)) {
        if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            await sock.sendMessage(msg.key.remoteJid, { text: "Please quote a message to forward." });
            return;
        }

        const quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;

        await sock.sendMessage(msg.key.remoteJid, {
            forward: msg.message.extendedTextMessage.contextInfo.quotedMessage,
        });
    }
}
