import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { loadConfiguration } from './server/config';
import { connectDatabase } from './server/db';
import routes from './server/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  loadConfiguration();
  await connectDatabase();

  const app = express();
  
  // Security middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Vite requires inline scripts during dev
  }) as any);
  
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.PUBLIC_URL : '*',
    credentials: true,
  }) as any);
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    message: { error: "Too many requests from this IP, please try again after 15 minutes" }
  });
  app.use('/api', limiter as any);
  
  app.use(express.json({ limit: '1mb' }) as any);

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
