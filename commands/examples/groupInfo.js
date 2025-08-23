const commands = [
    "groupinfo",
    "gcinfo"
];

export default async function (sock, msg, text) {
    if (commands.includes(text)) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            await sock.sendMessage(jid, { text: 'This command can only be used in a group.' });
            return;
        }

        try {
            const metadata = await sock.groupMetadata(jid);

            const infoText = `*Group Info*

*Name:* ${metadata.subject}
*Participants:* ${metadata.participants.length}
*Description:*
${metadata.desc || 'No description'}`;

            await sock.sendMessage(jid, { text: infoText });

        } catch (e) {
            console.error(e);
            await sock.sendMessage(jid, { text: 'Failed to get group info.' });
        }
    }
}
