import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

export const loadConfiguration = () => {
  const cwd = process.cwd();
  const searchPaths = [
    path.resolve(cwd, 'public_html/.builds/config/.env'),
    path.resolve(cwd, '.env'),
    path.resolve(cwd, '..', '.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env')
  ];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      return { path: p, loaded: true };
    }
  }
  return { path: null, loaded: false };
};
