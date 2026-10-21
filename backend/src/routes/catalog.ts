import { Router, Request, Response } from 'express';
import { getDb } from '../db/index.js';
import { cleanupExpiredLocks } from '../services/orderService.js';

export const catalogRouter = Router();

// GET /catalog
catalogRouter.get('/', (req: Request, res: Response) => {
  cleanupExpiredLocks();
  const db = getDb();

  const projects = db
    .prepare(
      `SELECT id as projectId, name, token_id as tokenId, price_per_tonne_usd as pricePerTonneUsd, ndvi_mean as ndviMean, status
       FROM projects
       WHERE status IN ('LISTED', 'SOLD_OUT')
       ORDER BY created_at DESC`
    )
    .all() as Array<{
    projectId: string;
    name: string;
    tokenId: string | null;
    pricePerTonneUsd: number;
    ndviMean: number | null;
    status: string;
  }>;

  const catalog = projects.map((p) => {
    const availableCount = db
      .prepare(
        "SELECT COUNT(*) as count FROM project_serials WHERE project_id = ? AND status = 'AVAILABLE'"
      )
      .get(p.projectId) as { count: number };

    return {
      projectId: p.projectId,
      name: p.name,
      tokenId: p.tokenId || '',
      availableSerials: availableCount.count,
      pricePerTonneUsd: p.pricePerTonneUsd,
      ndviMean: p.ndviMean,
      status: p.status,
    };
  });

  res.json(catalog);
});
