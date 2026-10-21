import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { hederaClient } from '../adapters/hederaClient.js';
import { config } from '../config.js';

export function cleanupExpiredLocks(): void {
  const db = getDb();
  const now = new Date().toISOString();

  const expiredOrders = db
    .prepare("SELECT id FROM orders WHERE status = 'LOCKED' AND expires_at < ?")
    .all(now) as Array<{ id: string }>;

  if (expiredOrders.length > 0) {
    db.transaction(() => {
      for (const order of expiredOrders) {
        db.prepare("UPDATE orders SET status = 'EXPIRED' WHERE id = ?").run(order.id);
        db.prepare(
          "UPDATE project_serials SET status = 'AVAILABLE', order_id = NULL, locked_at = NULL WHERE order_id = ? AND status = 'LOCKED'"
        ).run(order.id);
      }
    })();
  }
}

export async function createOrder(data: {
  buyerId: string;
  projectId: string;
  quantity: number;
}): Promise<{
  orderId: string;
  status: string;
  expiresAt: string;
  totalUsd: number;
}> {
  const db = getDb();

  // Auto-expire stale locks first
  cleanupExpiredLocks();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(data.projectId) as any;
  if (!project) {
    const error: any = new Error(`Project ${data.projectId} not found`);
    error.status = 404;
    throw error;
  }

  if (project.status !== 'LISTED') {
    const error: any = new Error(
      `Cannot purchase credits for project in status "${project.status}". Must be "LISTED".`
    );
    error.status = 400;
    throw error;
  }

  // Find available serials
  const availableSerials = db
    .prepare(
      `SELECT token_id, serial FROM project_serials
       WHERE project_id = ? AND status = 'AVAILABLE'
       ORDER BY serial ASC
       LIMIT ?`
    )
    .all(data.projectId, data.quantity) as Array<{ token_id: string; serial: number }>;

  if (availableSerials.length < data.quantity) {
    const availableTotal = db
      .prepare(
        "SELECT COUNT(*) as count FROM project_serials WHERE project_id = ? AND status = 'AVAILABLE'"
      )
      .get(data.projectId) as { count: number };

    const error: any = new Error(
      `Insufficient available serials. Requested: ${data.quantity}, Available: ${availableTotal.count}`
    );
    error.status = 400;
    error.available = availableTotal.count;
    throw error;
  }

  const orderId = `ord_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.orderLockTimeoutMs).toISOString();
  const totalUsd = Number((data.quantity * project.price_per_tonne_usd).toFixed(2));

  // Perform locking inside a database transaction
  db.transaction(() => {
    db.prepare(`
      INSERT INTO orders (
        id, buyer_id, project_id, quantity, total_usd, status,
        expires_at, wipe_tx_id, hcs_seq, hcs_tx_id, certificate_url, created_at, paid_at
      ) VALUES (?, ?, ?, ?, ?, 'LOCKED', ?, NULL, NULL, NULL, NULL, ?, NULL)
    `).run(orderId, data.buyerId, data.projectId, data.quantity, totalUsd, expiresAt, now.toISOString());

    const updateSerialStmt = db.prepare(`
      UPDATE project_serials
      SET status = 'LOCKED', order_id = ?, locked_at = ?
      WHERE token_id = ? AND serial = ?
    `);

    const insertOrderSerialStmt = db.prepare(`
      INSERT INTO order_serials (order_id, token_id, serial)
      VALUES (?, ?, ?)
    `);

    for (const item of availableSerials) {
      updateSerialStmt.run(orderId, now.toISOString(), item.token_id, item.serial);
      insertOrderSerialStmt.run(orderId, item.token_id, item.serial);
    }
  })();

  return {
    orderId,
    status: 'LOCKED',
    expiresAt,
    totalUsd,
  };
}

export async function payOrder(orderId: string): Promise<{
  status: string;
  serials: number[];
  wipeTxId: string;
  hcsSeq: number;
  certificateUrl: string;
}> {
  const db = getDb();
  cleanupExpiredLocks();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) {
    const error: any = new Error(`Order ${orderId} not found`);
    error.status = 404;
    throw error;
  }

  // Idempotency: If already paid & retired, return the existing confirmation
  if (order.status === 'RETIRED') {
    const serialRows = db
      .prepare('SELECT serial FROM order_serials WHERE order_id = ? ORDER BY serial ASC')
      .all(orderId) as Array<{ serial: number }>;

    return {
      status: 'RETIRED',
      serials: serialRows.map((r) => r.serial),
      wipeTxId: order.wipe_tx_id || '',
      hcsSeq: order.hcs_seq || 0,
      certificateUrl: order.certificate_url || `/api/orders/${orderId}/certificate`,
    };
  }

  if (order.status === 'EXPIRED') {
    const error: any = new Error('Cannot pay for an expired order. Please place a new order.');
    error.status = 400;
    throw error;
  }

  if (new Date() > new Date(order.expires_at)) {
    // Lock timed out
    db.prepare("UPDATE orders SET status = 'EXPIRED' WHERE id = ?").run(orderId);
    db.prepare(
      "UPDATE project_serials SET status = 'AVAILABLE', order_id = NULL, locked_at = NULL WHERE order_id = ?"
    ).run(orderId);

    const error: any = new Error('The 15-minute lock on these serials has expired.');
    error.status = 400;
    throw error;
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(order.project_id) as any;
  if (!project || !project.token_id) {
    const error: any = new Error('Associated token not found for project');
    error.status = 500;
    throw error;
  }

  const serialRows = db
    .prepare('SELECT serial FROM order_serials WHERE order_id = ? ORDER BY serial ASC')
    .all(orderId) as Array<{ serial: number }>;
  const serials = serialRows.map((r) => r.serial);

  if (serials.length === 0) {
    const error: any = new Error('No serials associated with this order');
    error.status = 500;
    throw error;
  }

  const buyerAccountId = config.buyerId;
  const buyerPrivateKey = config.buyerKey;

  // 1. Associate buyer account with the NFT class
  await hederaClient.associateToken(buyerAccountId, buyerPrivateKey, project.token_id);

  // 2. Transfer serials from treasury to buyer
  await hederaClient.transferSerials(project.token_id, serials, buyerAccountId);

  // 3. Wipe serials from buyer's account (permanent burn/retirement)
  const wipeTxId = await hederaClient.wipeSerials(project.token_id, buyerAccountId, serials);

  const now = new Date().toISOString();

  // 4. Publish retirement record to HCS topic ct.retirement
  const hcsRetirementResult = await hederaClient.submitMessage(config.topicRetirement, {
    schema_version: '1.0',
    message_type: 'ct.retirement',
    order_id: orderId,
    project_id: order.project_id,
    token_id: project.token_id,
    serials_range: [Math.min(...serials), Math.max(...serials)],
    serials,
    quantity: order.quantity,
    wipe_tx: wipeTxId,
    buyer_id: order.buyer_id,
    timestamp: now,
  });

  const certificateUrl = `/api/orders/${orderId}/certificate`;

  // 5. Update DB status inside transaction
  db.transaction(() => {
    db.prepare(`
      UPDATE orders
      SET status = 'RETIRED', wipe_tx_id = ?, hcs_seq = ?, hcs_tx_id = ?,
          certificate_url = ?, paid_at = ?
      WHERE id = ?
    `).run(wipeTxId, hcsRetirementResult.sequence, hcsRetirementResult.txId, certificateUrl, now, orderId);

    db.prepare(`
      UPDATE project_serials
      SET status = 'RETIRED'
      WHERE order_id = ?
    `).run(orderId);

    // Check if project is completely sold out
    const remaining = db
      .prepare(
        "SELECT COUNT(*) as count FROM project_serials WHERE project_id = ? AND status != 'RETIRED'"
      )
      .get(order.project_id) as { count: number };

    if (remaining.count === 0) {
      db.prepare("UPDATE projects SET status = 'SOLD_OUT', updated_at = ? WHERE id = ?").run(
        now,
        order.project_id
      );
    }
  })();

  return {
    status: 'RETIRED',
    serials,
    wipeTxId,
    hcsSeq: hcsRetirementResult.sequence,
    certificateUrl,
  };
}
