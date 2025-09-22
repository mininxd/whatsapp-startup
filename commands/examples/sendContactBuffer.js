import fs from 'fs';

const commands = [
  "vcardBuffer",
  "contactsBuffer",
  "kontakBuffer",
  "contactBuffer"
];

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    const vcard = fs.readFileSync('./path/to/contact.vcf', 'utf-8');

    await sock.sendMessage(msg.key.remoteJid, {
      contacts: {
        displayName: 'Firstname Lastname',
        contacts: [{ vcard }]
      }
    });
  }
}
