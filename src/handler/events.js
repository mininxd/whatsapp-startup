/**
 * File ini bertanggung jawab untuk menangani berbagai event dari socket WhatsApp.
 * Event-event ini termasuk pembaruan grup, pembaruan partisipan,
 * pembaruan status baterai, dan panggilan masuk.
 * 
 * This file is responsible for handling various events from the WhatsApp socket.
 * These events include group updates, participant updates,
 * battery status updates, and incoming calls.
 */

export default function handleEvents(sock) {

  // Menangani event pembaruan grup.
  // Handle group update events.
  sock.ev.on('groups.update', update => {
    console.log('Group updated:', update);
  });

  // Menangani event pembaruan partisipan grup.
  // Handle group participant update events.
  sock.ev.on('group-participants.update', update => {
    console.log('Participant update:', update);
  });

  // Menangani event pembaruan status baterai.
  // Handle battery status update events.
  sock.ev.on('battery.update', update => {
    console.log('Battery info:', update);
  });

  // Menangani event panggilan masuk.
  // Handle incoming call events.
  sock.ev.on('call', call => {
    console.log('Incoming call:', call);
  });
}
