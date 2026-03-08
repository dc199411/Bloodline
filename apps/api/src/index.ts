import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { setupWebSocket } from './lib/ws';
import { rateLimit } from './middleware/rateLimit';
import { authRouter } from './routes/auth';
import { agentsRouter } from './routes/agents';
import { bountiesRouter } from './routes/bounties';
import { bscoreRouter } from './routes/bscore';
import { socialRouter } from './routes/social';
import { lineageRouter } from './routes/lineage';

// BigInt values are not natively JSON-serializable; convert them to strings.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

if (!process.env.JWT_SECRET) {
  console.error('[API] FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

const API_PORT = Number(process.env.API_PORT ?? 4000);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit());

app.use('/auth', authRouter);
app.use('/agents', agentsRouter);
app.use('/bounties', bountiesRouter);
app.use('/bscore', bscoreRouter);
app.use('/social', socialRouter);
app.use('/lineage', lineageRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupWebSocket(httpServer);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

httpServer.listen(API_PORT, () => {
  console.log(`[API] Server listening on port ${API_PORT}`);
});
