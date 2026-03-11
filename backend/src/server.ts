import http from 'node:http';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config.js';
import { authRouter } from './routes/auth.js';
import { dataRouter } from './routes/data.js';
import { eventsRouter } from './routes/events.js';
import { healthRouter } from './routes/health.js';
import { uploadsRouter } from './routes/uploads.js';
import { attachRealtimeServer } from './realtime/ws.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/health', healthRouter);
app.use('/v1/auth', authRouter);
app.use('/v1/uploads', uploadsRouter);
app.use('/v1/events', eventsRouter);
app.use('/v1/data', dataRouter);

const server = http.createServer(app);
attachRealtimeServer(server);

server.listen(env.PORT, () => {
   
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});