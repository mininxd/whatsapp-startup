import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const socketDir = path.join(__dirname, '../../commands/socket');

const socketHandlers = {};

// Load all .js files in commands/socket/
for (const file of fs.readdirSync(socketDir)) {
  if (!file.endsWith('.js')) continue;

  const { default: handler } = await import(path.join(socketDir, file));
  const commandName = path.basename(file, '.js');

  socketHandlers[commandName] = handler;

  console.log(
    chalk.bold.hex('#899bdd')('[SOCKET] Event Loaded : ' ) +
    chalk.yellow(commandName)
  );
}

export default function setupSocket(socket, sock) {
  console.log(
    chalk.bold.hex('#899bdd')('[SOCKET] Client Connected : ') +
    chalk.gray(socket.id)
  );

  for (const [event, handler] of Object.entries(socketHandlers)) {
    socket.on(event, async (data) => {
      try {
        await handler(sock, socket, data); // sock = WA socket instance
        socket.emit(`${event}:done`, 'OK');
      } catch (err) {
        socket.emit(`${event}:error`, err.message || 'Unknown error');
      }
    });
  }

  socket.on('disconnect', () => {
    console.log(
      chalk.bold.hex('#899bdd')('[SOCKET] Client Disconnected : ') +
      chalk.gray(socket.id)
    );
  });
}
