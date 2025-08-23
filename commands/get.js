import fetch from 'node-fetch';

const commands = [
    "get"
];

export default async function (sock, msg, text) {
    if (text.toLowerCase().startsWith(commands[0])) {
        const url = text.substring(commands[0].length).trim();

        if (!url) {
            await sock.sendMessage(msg.key.remoteJid, { text: "Please provide a URL to fetch.\n\nExample: get https://api.github.com/users/octocat" });
            return;
        }

        try {
            // Validate URL
            new URL(url);

            const response = await fetch(url);

            if (!response.ok) {
                await sock.sendMessage(msg.key.remoteJid, { text: `Failed to fetch URL. Status: ${response.status} ${response.statusText}` });
                return;
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const json = await response.json();
                const formattedJson = JSON.stringify(json, null, 2);

                // Send formatted JSON as text
                await sock.sendMessage(msg.key.remoteJid, { text: formattedJson });

                // Send as a JSON file
                const buffer = Buffer.from(formattedJson, 'utf-8');
                await sock.sendMessage(msg.key.remoteJid, {
                    document: buffer,
                    mimetype: 'application/json',
                    fileName: 'response.json'
                });

            } else {
                const body = await response.text();
                await sock.sendMessage(msg.key.remoteJid, { text: body });
            }

        } catch (error) {
            console.error(error);
            if (error.code === 'ERR_INVALID_URL') {
                 await sock.sendMessage(msg.key.remoteJid, { text: "Invalid URL format provided." });
            } else {
                 await sock.sendMessage(msg.key.remoteJid, { text: "An error occurred while fetching the URL." });
            }
        }
    }
}
