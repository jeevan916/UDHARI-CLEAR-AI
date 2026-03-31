import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { loadConfiguration } from './server/config';
import { connectDatabase } from './server/db';
import routes from './server/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  loadConfiguration();
  await connectDatabase();

  const app = express();
  app.use(cors() as any);
  app.use(express.json() as any);

  app.use(routes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => console.log(`[CORE] Enterprise server active on port ${PORT}`));
}

startServer();
