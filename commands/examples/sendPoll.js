const commands = [
    "poll",
    "vote"
];

export default async function (sock, msg, text) {
    if (commands.includes(text)) {
        const poll = {
            name: "Best Programming Language",
            values: [
                "JavaScript",
                "Python",
                "Java",
                "C++"
            ],
            selectableCount: true
        };

        await sock.sendMessage(msg.key.remoteJid, {
            poll: poll
        });
    }
}
