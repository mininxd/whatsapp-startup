import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getSender } from '../helper/getSender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, '../../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

export default function isAdmin(msg) {
  const sender = getSender(msg);
  const bareSender = sender.split('@')[0];
  return config.admin.includes(bareSender);
}