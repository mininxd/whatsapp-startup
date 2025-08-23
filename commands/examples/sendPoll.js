const commands = [
    "poll",
    "vote"
];

export default async function (sock, msg, text) {
    for (const command of commands) {
        if (text.toLowerCase().startsWith(command)) {
            const argsText = text.substring(command.length).trim();
            if (!argsText) {
                await sock.sendMessage(msg.key.remoteJid, { text: `Please provide a question and options for the poll.\n\nExample: ${command} What is your favorite color?, Blue, Red, Green` });
                return;
            }

            const parts = argsText.split(',').map(part => part.trim());
            if (parts.length < 3) { // question, opt1, opt2
                await sock.sendMessage(msg.key.remoteJid, { text: `A poll requires a question and at least two options.\n\nExample: ${command} What is your favorite color?, Blue, Red, Green` });
                return;
            }

            const question = parts[0];
            const options = parts.slice(1);

            const poll = {
                name: question,
                values: options,
                selectableCount: true
            };

            await sock.sendMessage(msg.key.remoteJid, {
                poll: poll
            });
            return; // Exit after handling the command
        }
    }
}
