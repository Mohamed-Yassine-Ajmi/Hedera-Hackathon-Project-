import { Router, Request, Response, NextFunction } from 'express';
import { createOrderSchema } from '../schemas/validation.js';
import * as orderService from '../services/orderService.js';
import * as certificateService from '../services/certificateService.js';
import { getDb } from '../db/index.js';

export const ordersRouter = Router();

// POST /orders
ordersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createOrderSchema.parse(req.body);
    const result = await orderService.createOrder(validated);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /orders/:id
ordersRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    orderService.cleanupExpiredLocks();
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id as string) as any;

    if (!order) {
      res.status(404).json({ error: `Order ${req.params.id} not found` });
      return;
    }

    const serialRows = db
      .prepare('SELECT serial FROM order_serials WHERE order_id = ? ORDER BY serial ASC')
      .all(order.id) as Array<{ serial: number }>;

    res.json({
      ...order,
      serials: serialRows.map((s) => s.serial),
    });
  } catch (err) {
    next(err);
  }
});

// POST /orders/:id/pay
ordersRouter.post('/:id/pay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await orderService.payOrder(req.params.id as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /orders/:id/certificate
ordersRouter.get('/:id/certificate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await certificateService.generateCertificatePdf(req.params.id as string, res);
  } catch (err) {
    next(err);
  }
});
