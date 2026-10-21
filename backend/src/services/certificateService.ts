import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Response } from 'express';
import { getDb } from '../db/index.js';
import { hederaClient } from '../adapters/hederaClient.js';
import { config } from '../config.js';

export async function generateCertificatePdf(orderId: string, res: Response): Promise<void> {
  const db = getDb();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) {
    res.status(404).json({ error: `Order ${orderId} not found` });
    return;
  }

  if (order.status !== 'RETIRED') {
    res.status(400).json({ error: `Certificate is only available for RETIRED orders (current status: ${order.status})` });
    return;
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(order.project_id) as any;
  const buyer = db.prepare('SELECT * FROM actors WHERE id = ?').get(order.buyer_id) as any;

  const serialRows = db
    .prepare('SELECT serial FROM order_serials WHERE order_id = ? ORDER BY serial ASC')
    .all(orderId) as Array<{ serial: number }>;
  const serials = serialRows.map((r) => r.serial);
  const minSerial = Math.min(...serials);
  const maxSerial = Math.max(...serials);
  const serialRangeStr = minSerial === maxSerial ? `#${minSerial}` : `#${minSerial} - #${maxSerial}`;

  const explorerUrl = `${config.frontendUrl}/explorer/project/${order.project_id}`;
  const qrBuffer = await QRCode.toBuffer(explorerUrl, { width: 130, margin: 1 });

  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="climatetrust-certificate-${orderId}.pdf"`);

  doc.pipe(res);

  // Decorative Border
  doc.rect(20, 20, 555, 802).lineWidth(2).strokeColor('#059669').stroke();
  doc.rect(24, 24, 547, 794).lineWidth(0.5).strokeColor('#10B981').stroke();

  // Header Banner
  doc.moveDown(1.5);
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#065F46').text('CLIMATETRUST', { align: 'center' });
  doc.fontSize(11).font('Helvetica').fillColor('#047857').text('MEDITERRANEAN & NORTH AFRICA CARBON MARKETPLACE', { align: 'center' });
  doc.moveDown(0.8);

  doc.fontSize(16).font('Helvetica-Bold').fillColor('#111827').text('CERTIFICATE OF CARBON OFFSET RETIREMENT', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text(`Certificate ID: ${orderId}`, { align: 'center' });

  doc.moveDown(1.5);
  doc.fontSize(11).font('Helvetica').fillColor('#374151').text('This official certificate confirms the permanent, irreversible retirement of verified carbon credits on the Hedera Hashgraph distributed ledger:', { align: 'center' });
  doc.moveDown(1.5);

  // Highlight Box: Quantity
  const boxTop = doc.y;
  doc.rect(140, boxTop, 315, 55).fillColor('#ECFDF5').fill();
  doc.rect(140, boxTop, 315, 55).lineWidth(1).strokeColor('#A7F3D0').stroke();
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#065F46').text(`${order.quantity} TONNES CO2e`, 140, boxTop + 10, { width: 315, align: 'center' });
  doc.fontSize(9).font('Helvetica').fillColor('#047857').text('PERMANENTLY RETIRED & WIPED FROM CIRCULATION', 140, boxTop + 36, { width: 315, align: 'center' });

  doc.y = boxTop + 75;

  // Key Details Table
  const leftX = 55;
  const rightX = 220;
  let currY = doc.y;

  const addRow = (label: string, value: string, isHash = false) => {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#4B5563').text(label, leftX, currY);
    if (isHash) {
      doc.fontSize(8.5).font('Courier').fillColor('#1F2937').text(value, rightX, currY + 1, { width: 320 });
      currY += 22;
    } else {
      doc.fontSize(10).font('Helvetica').fillColor('#111827').text(value, rightX, currY, { width: 320 });
      currY += 20;
    }
  };

  addRow('Beneficiary / Buyer:', buyer ? `${buyer.name} (${buyer.hedera_account_id})` : order.buyer_id);
  addRow('Project Name:', project ? project.name : order.project_id);
  addRow('Standard & Methodology:', project ? project.methodology : 'VM0007 / Verified Carbon Standard');
  addRow('HTS Token ID:', project?.token_id || '0.0.3001');
  addRow('Retired Serial Numbers:', `${serialRangeStr} (Total: ${order.quantity})`);
  addRow('Retirement Date:', order.paid_at || new Date().toISOString());
  addRow('Hedera Wipe Tx ID:', order.wipe_tx_id || 'N/A', true);
  addRow('HCS Retirement Topic:', config.topicRetirement);
  addRow('HCS Sequence Number:', `#${order.hcs_seq || 1}`);

  doc.moveDown(1.5);

  // QR Code & Verification link
  const qrY = 630;
  doc.image(qrBuffer, 70, qrY, { width: 95 });

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#065F46').text('Scan to Verify On-Chain', 180, qrY + 15);
  doc.fontSize(8.5).font('Helvetica').fillColor('#4B5563').text(
    'This carbon retirement is immutably recorded on Hedera Testnet. Anyone can verify the NFT burn and consensus logs directly via the Mirror Node and HashScan.',
    180,
    qrY + 30,
    { width: 330 }
  );

  const hashscan = hederaClient.hashscanUrl(order.wipe_tx_id || '0.0.123456');
  doc.fontSize(8).font('Helvetica-Oblique').fillColor('#2563EB').text(
    `HashScan Explorer: ${hashscan}`,
    180,
    qrY + 68,
    { width: 330 }
  );

  // Footer Disclaimer
  doc.fontSize(7.5).font('Helvetica').fillColor('#9CA3AF').text(
    'ClimateTrust anti-greenwashing guarantee: All serials are permanently destroyed using Hedera Token Service TokenWipe to prevent double-spending or secondary resale.',
    50,
    780,
    { width: 495, align: 'center' }
  );

  doc.end();
}
