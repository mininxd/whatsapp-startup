import fetch from 'node-fetch';

const commands = [
    "post"
];

export default async function (sock, msg, text) {
    if (!text.toLowerCase().startsWith(commands[0])) {
        return;
    }

    const argString = text.substring(commands[0].length).trim();

    if (!argString) {
        await sock.sendMessage(msg.key.remoteJid, { text: "Please provide a URL and data to post.\n\nExample: post https://api.example.com, {\"key\": \"value\"}, {\"Authorization\": \"Bearer token\"}" });
        return;
    }

    const parts = argString.split(/,(?=\s*\{)/);
    const url = parts[0].trim();

    if (!url) {
        await sock.sendMessage(msg.key.remoteJid, { text: "Please provide a URL to fetch.\n\nExample: post https://api.github.com/users/octocat" });
        return;
    }

    let body = {};
    let options = {};

    if (parts[1]) {
        try {
            body = JSON.parse(parts[1].trim());
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: `Invalid JSON in request body: ${error.message}` });
            return;
        }
    }

    if (parts[2]) {
        try {
            options = JSON.parse(parts[2].trim());
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, { text: `Invalid JSON in options: ${error.message}` });
            return;
        }
    }

    try {
        // Validate URL
        new URL(url);

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json', ...options }
        });

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
            const responseBody = await response.text();
            await sock.sendMessage(msg.key.remoteJid, { text: responseBody });
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
