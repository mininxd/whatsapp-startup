export default function handleEvents(sock) {

  sock.ev.on('groups.update', update => {
    console.log('Group updated:', update);
  });

  sock.ev.on('group-participants.update', update => {
    console.log('Participant update:', update);
  });

  sock.ev.on('battery.update', update => {
    console.log('Battery info:', update);
  });

  sock.ev.on('call', call => {
    console.log('Incoming call:', call);
  });
}
