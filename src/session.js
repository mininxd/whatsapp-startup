import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authDir = path.join(__dirname, '..', 'auth');


export function cleanSession() {
  fs.readdir(authDir, (err, files) => {
    if (err) return console.error(err);

    files.forEach(file => {
      if (
        file.startsWith('creds') ||
        file.startsWith('app-state')
      ) {
        return;
      }

      if (
        file.startsWith('pre-key') ||
        file.startsWith('sender-key') ||
        file.startsWith('session')
      ) {
        fs.unlink(path.join(authDir, file), err => {
          if (err) console.error(err);
          else console.log(`[CRON] Deleted: ${file}`);
        });
      }
    });
  });
  
cron.schedule('0 */12 * * *', () => {
  console.log('[CRON] Cleaning up auth folder...');
  cleanSession();
});
};