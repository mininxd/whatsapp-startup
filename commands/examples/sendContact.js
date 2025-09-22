const commands = [
  "vcard",
  "contacts",
  "kontak",
  "contact"
];

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    const vcard =
      `BEGIN:VCARD
      VERSION:3.0
      N:Lastname;Firstname;;;
      FN:Firstname Lastname
      TEL;TYPE=CELL:+1234567890
      EMAIL:example@example.com
      END:VCARD`;


    await sock.sendMessage(msg.key.remoteJid, {
      contacts: {
        displayName: 'Firstname Lastname',
        contacts: [{ vcard }]
      }
    });
  }
}
