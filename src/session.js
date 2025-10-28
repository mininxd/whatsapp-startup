import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authDir = path.join(__dirname, '..', 'auth');

export async function cleanSession() {
  try {
    const files = await fs.readdir(authDir);
    for (const file of files) {
      if (
        !file.startsWith('creds') &&
        !file.startsWith('app-state') &&
        (file.startsWith('pre-key') ||
          file.startsWith('sender-key') ||
          file.startsWith('session'))
      ) {
        await fs.unlink(path.join(authDir, file));
        console.log(`[CRON] Deleted: ${file}`);
      }
    }
  } catch (err) {
    console.error('Error cleaning session:', err);
  }
}

cron.schedule('0 */12 * * *', () => {
  console.log('[CRON] Cleaning up auth folder...');
  cleanSession();
});