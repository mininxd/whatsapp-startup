const commands = [
  "location",
  "lokasi"
];

export default async function (sock, msg, text) {
  if (commands.includes(text)) {
    await sock.sendMessage(msg.key.remoteJid, {
      location: {
        degreesLatitude: 51.5126083,
        degreesLongitude: -0.2191389,
        name: '51° 30′ 45.39″ n, 0° 13′ 08.9″ w',
        address: 'Never Gonna Give You Up!'
      }
    });
  }
}
