import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function start(file) {
  let args = [path.join(__dirname, file), ...process.argv.slice(2)];
  let p = spawn(process.argv[0], args, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  })
  .on('message', (data) => {
    console.log(data);
  })
  .on('error', (e) => {
      console.error(e);
      fs.watchFile(args[0], () => {
        start(file);
        fs.unwatchFile(args[0]);
      });
    })
  }

start('./src/connect.js');
