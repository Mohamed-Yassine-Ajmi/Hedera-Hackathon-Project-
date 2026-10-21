import { Router, Request, Response, NextFunction } from 'express';
import * as explorerService from '../services/explorerService.js';

export const explorerRouter = Router();

// GET /explorer/project (with ?q=...)
explorerRouter.get('/project', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryTerm = (req.query.q as string) || '';
    const result = await explorerService.getProjectExplorerEvents(queryTerm);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /explorer/project/:id
explorerRouter.get('/project/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryTerm = (req.params.id as string) || (req.query.q as string) || '';
    const result = await explorerService.getProjectExplorerEvents(queryTerm);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /explorer/serial/:tokenId/:serial
explorerRouter.get('/serial/:tokenId/:serial', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenId = req.params.tokenId as string;
    const serial = parseInt(req.params.serial as string, 10);

    if (isNaN(serial)) {
      res.status(400).json({ error: 'Serial must be a valid integer' });
      return;
    }

    const result = await explorerService.getSerialExplorerEvents(tokenId, serial);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
