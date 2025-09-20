// This is an example of a socket command that listens for incoming messages
// and forwards them to the connected client.

export default async function messages(sock, socket, data) {
  sock.ev.on('messages.upsert', (m) => {
    if (m.type !== 'notify') return;
    socket.emit('messages.upsert', m);
  });
}
