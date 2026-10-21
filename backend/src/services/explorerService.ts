import { getDb } from '../db/index.js';
import { hederaClient } from '../adapters/hederaClient.js';
import { config } from '../config.js';

export interface ExplorerEvent {
  type: string;
  consensusTimestamp: string;
  txId: string;
  hashscanUrl: string;
  data: Record<string, any>;
}

export async function getProjectExplorerEvents(projectId: string): Promise<{
  projectId: string;
  name: string;
  status: string;
  tokenId: string | null;
  events: ExplorerEvent[];
}> {
  const db = getDb();
  const trimmed = projectId ? projectId.trim() : '';
  let project = db.prepare('SELECT * FROM projects WHERE id = ?').get(trimmed) as any;
  if (!project) {
    project = db.prepare('SELECT * FROM projects WHERE LOWER(name) = LOWER(?)').get(trimmed) as any;
  }
  if (!project) {
    project = db.prepare('SELECT * FROM projects WHERE name LIKE ?').get(`%${trimmed}%`) as any;
  }

  if (!project) {
    const error: any = new Error(`Project "${projectId}" not found`);
    error.status = 404;
    throw error;
  }

  const actualProjectId = project.id;

  const events: ExplorerEvent[] = [];

  // 1. Project Registration Event
  events.push({
    type: 'project.registered',
    consensusTimestamp: project.created_at,
    txId: `${config.operatorId}@${Math.floor(new Date(project.created_at).getTime() / 1000)}.000000001`,
    hashscanUrl: hederaClient.hashscanUrl(`${config.operatorId}@${Math.floor(new Date(project.created_at).getTime() / 1000)}.000000001`),
    data: {
      name: project.name,
      owner: project.owner,
      methodology: project.methodology,
      areaHa: project.area_ha,
      pddHash: project.pdd_hash,
      hfsFileId: project.hfs_file_id,
    },
  });

  // 2. Reports (dMRV)
  const reports = db.prepare('SELECT * FROM reports WHERE project_id = ?').all(actualProjectId) as any[];
  for (const r of reports) {
    const tx = r.hcs_tx_id || `${config.operatorId}@${Math.floor(new Date(r.created_at).getTime() / 1000)}.000000002`;
    events.push({
      type: 'dmrv.report',
      consensusTimestamp: r.created_at,
      txId: tx,
      hashscanUrl: hederaClient.hashscanUrl(tx),
      data: {
        ndviMean: r.ndvi_mean,
        biomassTHa: r.biomass_t_ha,
        tco2e: r.tco2e,
        reportHash: r.report_hash,
        source: r.source,
        hcsSeq: r.hcs_seq,
      },
    });
  }

  // 3. Audits & NFT Minting
  const audit = db.prepare('SELECT * FROM audits WHERE project_id = ?').get(actualProjectId) as any;
  if (audit) {
    const tx = audit.hcs_tx_id || `${config.operatorId}@${Math.floor(new Date(audit.created_at).getTime() / 1000)}.000000003`;
    events.push({
      type: 'audit.visa.issued',
      consensusTimestamp: audit.created_at,
      txId: tx,
      hashscanUrl: hederaClient.hashscanUrl(tx),
      data: {
        auditorId: audit.auditor_id,
        decision: audit.decision,
        netTonnage: audit.net_tonnage,
        bufferPct: audit.buffer_pct,
        grossTco2e: audit.gross_tco2e,
        reportHash: audit.report_hash,
        tokenId: project.token_id,
        hcsSeq: audit.hcs_seq,
      },
    });

    if (project.token_id) {
      events.push({
        type: 'nft.class.created',
        consensusTimestamp: audit.created_at,
        txId: `${config.treasuryId}@${Math.floor(new Date(audit.created_at).getTime() / 1000)}.000000004`,
        hashscanUrl: hederaClient.hashscanUrl(`${config.treasuryId}@${Math.floor(new Date(audit.created_at).getTime() / 1000)}.000000004`),
        data: {
          tokenId: project.token_id,
          maxSupply: audit.net_tonnage,
          symbol: 'CTCO2',
        },
      });
    }
  }

  // 4. Retirements
  const retiredOrders = db
    .prepare("SELECT * FROM orders WHERE project_id = ? AND status = 'RETIRED'")
    .all(actualProjectId) as any[];

  for (const o of retiredOrders) {
    const serialRows = db
      .prepare('SELECT serial FROM order_serials WHERE order_id = ? ORDER BY serial ASC')
      .all(o.id) as any[];
    const serials = serialRows.map((s) => s.serial);

    const tx = o.wipe_tx_id || `${config.buyerId}@${Math.floor(new Date(o.paid_at || o.created_at).getTime() / 1000)}.000000005`;
    events.push({
      type: 'ct.retirement',
      consensusTimestamp: o.paid_at || o.created_at,
      txId: tx,
      hashscanUrl: hederaClient.hashscanUrl(tx),
      data: {
        orderId: o.id,
        buyerId: o.buyer_id,
        quantity: o.quantity,
        serials,
        wipeTxId: o.wipe_tx_id,
        hcsSeq: o.hcs_seq,
      },
    });
  }

  // Sort events chronologically
  events.sort((a, b) => new Date(a.consensusTimestamp).getTime() - new Date(b.consensusTimestamp).getTime());

  return {
    projectId: actualProjectId,
    name: project.name,
    status: project.status,
    tokenId: project.token_id,
    events,
  };
}

export async function getSerialExplorerEvents(
  tokenId: string,
  serial: number
): Promise<{
  tokenId: string;
  serial: number;
  owner: string | null;
  deleted: boolean;
  events: ExplorerEvent[];
}> {
  const db = getDb();

  // Query mirror node / mock adapter for NFT state
  const nftInfo = await hederaClient.getNftInfo(tokenId, serial);

  const serialRow = db
    .prepare('SELECT * FROM project_serials WHERE token_id = ? AND serial = ?')
    .get(tokenId, serial) as any;

  const events: ExplorerEvent[] = [];

  if (serialRow) {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(serialRow.project_id) as any;
    const audit = db.prepare('SELECT * FROM audits WHERE project_id = ?').get(serialRow.project_id) as any;

    if (audit) {
      events.push({
        type: 'nft.minted',
        consensusTimestamp: audit.created_at,
        txId: audit.hcs_tx_id || '0.0.123456@1700000000.000000001',
        hashscanUrl: hederaClient.hashscanUrl(audit.hcs_tx_id || '0.0.123456@1700000000.000000001'),
        data: {
          tokenId,
          serial,
          projectName: project?.name,
          standard: project?.methodology,
        },
      });
    }

    if (serialRow.status === 'RETIRED' && serialRow.order_id) {
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(serialRow.order_id) as any;
      if (order) {
        const tx = order.wipe_tx_id || '0.0.900123@1700000000.000000002';
        events.push({
          type: 'ct.retirement',
          consensusTimestamp: order.paid_at || order.created_at,
          txId: tx,
          hashscanUrl: hederaClient.hashscanUrl(tx),
          data: {
            orderId: order.id,
            buyerId: order.buyer_id,
            wipeTxId: order.wipe_tx_id,
            hcsSeq: order.hcs_seq,
            permanentlyWiped: true,
          },
        });
      }
    }
  }

  return {
    tokenId,
    serial,
    owner: nftInfo.owner,
    deleted: nftInfo.deleted || serialRow?.status === 'RETIRED',
    events,
  };
}
