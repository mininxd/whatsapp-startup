const commands = [
    "buttons",
    "button"
];

export default async function (sock, msg, text) {
    if (commands.includes(text)) {
        const buttons = [
            { buttonId: 'id1', buttonText: { displayText: 'Button 1' }, type: 1 },
            { buttonId: 'id2', buttonText: { displayText: 'Button 2' }, type: 1 },
            { buttonId: 'id3', buttonText: { displayText: 'Button 3' }, type: 1 }
        ]

        const buttonMessage = {
            text: "Hi there!",
            footer: 'Hello World',
            buttons: buttons,
            headerType: 1
        }

        await sock.sendMessage(msg.key.remoteJid, buttonMessage);
    }
}
