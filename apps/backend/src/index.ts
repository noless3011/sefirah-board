import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import setupWorkspaceSockets from './sockets/workspace.js';
import { openApiDocument } from './swagger/openapi.js';

import { logger } from './utils/logger.js';

const requiredEnvVars = ['JWT_SECRET', 'CORS_ORIGIN'];
const NODE_ENV = process.env.NODE_ENV ?? 'development';

if (NODE_ENV !== 'test') {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      logger.warn(`[WARNING] Missing environment variable: ${envVar}`);
    }
  }
}

const PORT = process.env.PORT ?? '4000';
const ENABLE_FE_PROXY =
  (process.env.ENABLE_FE_PROXY ?? (NODE_ENV === 'development' ? 'true' : 'false')).toLowerCase() === 'true';
const FRONTEND_DEV_URL = process.env.FRONTEND_DEV_URL ?? 'http://localhost:5173';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

const isBackendPath = (pathname: string) =>
  pathname.startsWith('/api') || pathname.startsWith('/socket.io');

export const app = express();
export const httpServer = createServer(app);

const defaultCorsOrigin = ENABLE_FE_PROXY
  ? `http://localhost:${PORT}`
  : 'http://localhost:5173';
const corsOrigin = process.env.CORS_ORIGIN ?? defaultCorsOrigin;
app.use(cors({ 
  origin: corsOrigin,
  credentials: true 
}));
app.use(express.json());

app.get('/api/docs.json', (_req, res) => {
  res.status(200).json(openApiDocument);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// API Version 1
app.use('/api/v1', apiRouter);

// Specific Invites endpoint documented in API.md as standalone
import { Router } from 'express';
const invitesRouter = Router();
invitesRouter.post('/redeem', (req, res) => { res.send('Not implemented'); });
app.use('/api/v1/invites', invitesRouter);

if (ENABLE_FE_PROXY) {
  app.use(
    createProxyMiddleware({
      target: FRONTEND_DEV_URL,
      changeOrigin: true,
      ws: true,
      pathFilter: (pathname) => !isBackendPath(pathname),
    })
  );
  if (NODE_ENV !== 'test') {
    logger.info(`[${NODE_ENV}] Frontend reverse proxy enabled: ${FRONTEND_DEV_URL}`);
  }
} else if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.use((req, res, next) => {
    if (req.method !== 'GET' || isBackendPath(req.path)) {
      return next();
    }

    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });

  if (NODE_ENV !== 'test') {
    logger.info(`[${NODE_ENV}] Serving frontend build from ${frontendDistPath}`);
  }
} else {
  if (NODE_ENV !== 'test') {
    logger.warn(
      `[${NODE_ENV}] Frontend build not found at ${frontendDistPath}. ` +
        'Run frontend build or set ENABLE_FE_PROXY=true and start Vite.'
    );
  }
}

app.use(notFoundHandler);
app.use(errorHandler);

export const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

setupWorkspaceSockets(io);

if (NODE_ENV !== 'test') {
  httpServer.listen(Number(PORT), () => {
    logger.info(`[${NODE_ENV}] Backend listening on port ${PORT}`);
  });
}
