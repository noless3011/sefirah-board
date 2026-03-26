import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import setupWorkspaceSockets from './sockets/workspace.js';

const requiredEnvVars = ['JWT_SECRET', 'CORS_ORIGIN'];
const NODE_ENV = process.env.NODE_ENV ?? 'development';

if (NODE_ENV !== 'test') {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`[WARNING] Missing environment variable: ${envVar}`);
    }
  }
}

const PORT = process.env.PORT ?? '4000';

const app = express();
const httpServer = createServer(app);

const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
app.use(cors({ 
  origin: corsOrigin,
  credentials: true 
}));
app.use(express.json());

// API Version 1
app.use('/api/v1', apiRouter);

// Specific Invites endpoint documented in API.md as standalone
import { Router } from 'express';
const invitesRouter = Router();
invitesRouter.post('/redeem', (req, res) => { res.send('Not implemented'); });
app.use('/api/v1/invites', invitesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

setupWorkspaceSockets(io);

httpServer.listen(Number(PORT), () => {
  console.log(`[${NODE_ENV}] Backend listening on port ${PORT}`);
});
