import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.join(__dirname, '../../commands/express');

function getAllRouteFiles(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(base, entry.name);

    if (entry.isDirectory()) {
      files = files.concat(getAllRouteFiles(fullPath, path.join(base, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push({
        fullPath,
        routePath: '/' + relativePath.replace(/\.js$/, '').replace(/\\/g, '/')
      });
    }
  }

  return files;
}

// Helper: clean & trim values
function formatBodyValues(obj = {}, max = 80) {
  return Object.values(obj)
    .map(v => {
      const s = typeof v === 'string' ? v : JSON.stringify(v);
      return s.length > max ? s.slice(0, max) + '...' : s;
    })
    .join(' — ');
}

export default async function setupExpress(app) {
  const routeFiles = getAllRouteFiles(baseDir);

  for (const { fullPath, routePath } of routeFiles) {
    try {
      const { default: router } = await import(fullPath);

      // Log route calls
      app.use(routePath, (req, res, next) => {
        const method = req.method;
        const label = chalk.bold.hex('#899bdd')(`[${method}]`);
        const url = chalk.gray(routePath);
        const detail = method === 'POST' ? chalk.dim(`=> ${formatBodyValues(req.body)}`) : '';

        console.log(`${label} ${url} ${detail}`);
        next();
      });

      app.use(routePath, router);

      console.log(
        chalk.bold.hex('#899bdd')('[EXPRESS] Route Loaded : ') +
        chalk.yellow(routePath)
      );
    } catch (err) {
      console.error(
        chalk.bold.red('[EXPRESS] Failed to load route: ') +
        chalk.yellow(routePath),
        '\n',
        err
      );
    }
  }
}
