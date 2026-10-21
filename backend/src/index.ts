import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { config } from './config.js';
import { runMigrations } from './db/migrations.js';
import { seedDatabase } from './db/seed.js';

import { projectsRouter } from './routes/projects.js';
import { catalogRouter } from './routes/catalog.js';
import { footprintRouter } from './routes/footprint.js';
import { ordersRouter } from './routes/orders.js';
import { explorerRouter } from './routes/explorer.js';

// 1. Initialize SQLite Database & Seed Data
runMigrations();
seedDatabase();

export const app = express();

// 2. Core Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health Check
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'climatetrust-backend',
    useMocks: config.useMocks,
    network: config.hederaNetwork,
    timestamp: new Date().toISOString(),
  });
});

// 3. API Routes (mount both on /api and root for maximum client compatibility)
const apiRouter = express.Router();
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/catalog', catalogRouter);
apiRouter.use('/footprint', footprintRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/explorer', explorerRouter);

app.use('/api', apiRouter);
app.use('/', apiRouter);

// 4. Centralized Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  const status = typeof err.status === 'number' ? err.status : 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error ${status}] ${message}`, err.conflictingProjectId ? `(Conflicting: ${err.conflictingProjectId})` : '');

  res.status(status).json({
    error: message,
    ...(err.conflictingProjectId ? { conflictingProjectId: err.conflictingProjectId } : {}),
    ...(err.available !== undefined ? { available: err.available } : {}),
  });
});

// 5. Server Startup
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log('='.repeat(65));
    console.log(` ClimateTrust Backend API listening on port ${config.port}`);
    console.log(` Mode: ${config.useMocks ? 'MOCK (USE_MOCKS=true)' : 'LIVE HEDERA TESTNET'}`);
    console.log(` Database: ${config.databasePath}`);
    console.log(` Health check: http://localhost:${config.port}/health`);
    console.log('='.repeat(65));
  });
}
