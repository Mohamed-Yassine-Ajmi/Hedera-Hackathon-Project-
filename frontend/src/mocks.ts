/**
 * Realistic mock data for ClimateTrust demo.
 * Uses Ain Draham/Tabarka, Tunisia coordinates for the forest parcel.
 */
import type {
  Project, AnalysisResult, AuditResult, CatalogItem, FootprintResult,
  Order, PaymentResult, ProjectTimeline, SerialInfo, NdviPoint, VerifiableCredential,
} from './types';

// ----- Ain Draham forest polygon (real coordinates near Tabarka, Tunisia) -----
export const AIN_DRAHAM_GEOJSON = {
  type: 'Polygon' as const,
  coordinates: [[
    [8.6812, 36.7891],
    [8.7145, 36.7891],
    [8.7145, 36.8123],
    [8.6812, 36.8123],
    [8.6812, 36.7891],
  ]],
};

// ----- NDVI time-series (realistic for a regrowing Mediterranean forest) -----
export const MOCK_NDVI_SERIES: NdviPoint[] = [
  { date: '2026-03-15', value: 0.48 },
  { date: '2026-04-20', value: 0.52 },
  { date: '2026-05-25', value: 0.58 },
  { date: '2026-06-30', value: 0.63 },
  { date: '2026-08-10', value: 0.67 },
  { date: '2026-09-15', value: 0.69 },
];

// ----- Demo projects -----
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj_atlas_cedar',
    name: 'Atlas Cedar Reforestation & Watershed',
    owner: 'Atlas Conservation NGO',
    methodology: 'VM0007 - REDD+ Improved Forest Management',
    geojson: AIN_DRAHAM_GEOJSON,
    pddHash: '0xa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01',
    area_ha: 1045.2,
    status: 'LISTED',
    token_id: '0.0.300101',
    total_tonnage: 100,
    price_per_tonne_usd: 28.0,
    ndvi_mean: 0.68,
    created_at: '2026-10-20T12:00:00.000Z',
  },
  {
    id: 'proj_cap_bon',
    name: 'Cap Bon Agroforestry & Soil Carbon',
    owner: 'Tunisian Regenerative Farmers Collective',
    methodology: 'VM0042 - Improved Agricultural Land Management',
    geojson: {
      type: 'Polygon',
      coordinates: [[
        [10.80, 36.80],
        [10.95, 36.80],
        [10.95, 36.92],
        [10.80, 36.92],
        [10.80, 36.80],
      ]],
    },
    pddHash: '0xb2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01',
    area_ha: 480.5,
    status: 'ANALYZED',
    ndvi_mean: 0.55,
    price_per_tonne_usd: 32.5,
    created_at: '2026-10-20T14:00:00.000Z',
  },
  {
    id: 'proj_draft_test',
    name: 'Beja Highland Afforestation',
    owner: 'GreenBeja Foundation',
    methodology: 'AR-AM0014 - Afforestation and Reforestation',
    geojson: {
      type: 'Polygon',
      coordinates: [[
        [9.18, 36.72],
        [9.25, 36.72],
        [9.25, 36.78],
        [9.18, 36.78],
        [9.18, 36.72],
      ]],
    },
    pddHash: '0xc3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0123',
    area_ha: 320.0,
    status: 'DRAFT',
    created_at: '2026-10-20T16:00:00.000Z',
  },
];

// ----- Analysis result -----
export const MOCK_ANALYSIS: AnalysisResult = {
  ndviMean: 0.69,
  areaHa: 480.5,
  tco2e: 58,
  reportHash: '0x4f8a92b3c1d4e5f607182930a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
  hcsSeq: 103,
  status: 'ANALYZED',
  ndviSeries: MOCK_NDVI_SERIES,
};

// ----- Audit / VC result -----
const MOCK_VC: VerifiableCredential = {
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  type: ['VerifiableCredential', 'ClimateTrustAuditCredential'],
  issuer: 'did:hedera:testnet:0.0.800456',
  issuanceDate: '2026-10-20T12:30:00.000Z',
  credentialSubject: {
    projectId: 'proj_atlas_cedar',
    reportHash: '0x4f8a92b3c1d4e5f607182930a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
    grossTco2e: 120,
    bufferPct: 15,
    netTonnage: 100,
    decision: 'APPROVED',
  },
  proof: {
    type: 'Ed25519Signature2020',
    created: '2026-10-20T12:30:00.000Z',
    proofValue: 'a8f3b9c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
  },
};

export const MOCK_AUDIT_RESULT: AuditResult = {
  vc: MOCK_VC,
  tokenId: '0.0.300101',
  serials: Array.from({ length: 100 }, (_, i) => i + 1),
  txIds: ['0.0.123456@1700000000.000000000'],
  status: 'LISTED',
};

// ----- Catalog -----
export const MOCK_CATALOG: CatalogItem[] = [
  {
    projectId: 'proj_atlas_cedar',
    name: 'Atlas Cedar Reforestation & Watershed',
    tokenId: '0.0.300101',
    availableSerials: 80,
    pricePerTonneUsd: 28.0,
    ndviMean: 0.68,
    status: 'LISTED',
  },
];

// ----- Footprint result -----
export const MOCK_FOOTPRINT: FootprintResult = {
  tco2e: 2.02,
  totalKgCO2: 2022.0,
  breakdown: {
    electricityKg: 750.0,
    fuelKg: 1072.0,
    freightKg: 200.0,
  },
};

// ----- Order -----
export const MOCK_ORDER: Order = {
  orderId: 'ord_9f8e7d6c5b4a',
  status: 'LOCKED',
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  totalUsd: 140.0,
};

// ----- Payment -----
export const MOCK_PAYMENT: PaymentResult = {
  status: 'RETIRED',
  serials: [1, 2, 3, 4, 5],
  wipeTxId: '0.0.900123@1700000000.000000003',
  hcsSeq: 105,
  certificateUrl: '/api/orders/ord_9f8e7d6c5b4a/certificate',
};

// ----- Explorer timelines -----
export const MOCK_PROJECT_TIMELINE: ProjectTimeline = {
  projectId: 'proj_atlas_cedar',
  name: 'Atlas Cedar Reforestation & Watershed',
  status: 'LISTED',
  tokenId: '0.0.300101',
  events: [
    {
      type: 'project.registered',
      consensusTimestamp: '2026-10-20T10:00:00.000Z',
      txId: '0.0.123456@1700000000.000000001',
      hashscanUrl: 'https://hashscan.io/testnet/transaction/0.0.123456-1700000000-000000001',
      data: { areaHa: 1045.2, pddHash: '0xa1b2c3d4...' },
    },
    {
      type: 'dmrv.report',
      consensusTimestamp: '2026-10-20T11:00:00.000Z',
      txId: '0.0.123456@1700000000.000000002',
      hashscanUrl: 'https://hashscan.io/testnet/transaction/0.0.123456-1700000000-000000002',
      data: { ndviMean: 0.68, tco2e: 120 },
    },
    {
      type: 'audit.visa.issued',
      consensusTimestamp: '2026-10-20T11:30:00.000Z',
      txId: '0.0.123456@1700000000.000000003',
      hashscanUrl: 'https://hashscan.io/testnet/transaction/0.0.123456-1700000000-000000003',
      data: { netTonnage: 100, decision: 'APPROVED' },
    },
    {
      type: 'nft.minted',
      consensusTimestamp: '2026-10-20T11:31:00.000Z',
      txId: '0.0.123456@1700000000.000000004',
      hashscanUrl: 'https://hashscan.io/testnet/transaction/0.0.123456-1700000000-000000004',
      data: { tokenId: '0.0.300101', serialsCount: 100 },
    },
  ],
};

export const MOCK_SERIAL_INFO: SerialInfo = {
  tokenId: '0.0.300101',
  serial: 1,
  owner: null,
  deleted: true,
  events: [
    {
      type: 'nft.minted',
      consensusTimestamp: '2026-10-20T11:30:00.000Z',
      txId: '0.0.123456@1700000000.000000003',
      hashscanUrl: 'https://hashscan.io/testnet/transaction/0.0.123456-1700000000-000000003',
      data: { tokenId: '0.0.300101', serial: 1 },
    },
    {
      type: 'nft.transferred',
      consensusTimestamp: '2026-10-20T12:45:00.000Z',
      txId: '0.0.900123@1700000000.000000002',
      hashscanUrl: 'https://hashscan.io/testnet/transaction/0.0.900123-1700000000-000000002',
      data: { from: '0.0.500100', to: '0.0.600200' },
    },
    {
      type: 'ct.retirement',
      consensusTimestamp: '2026-10-20T12:50:00.000Z',
      txId: '0.0.900123@1700000000.000000003',
      hashscanUrl: 'https://hashscan.io/testnet/transaction/0.0.900123-1700000000-000000003',
      data: { wipeTxId: '0.0.900123@1700000000.000000003', permanentlyWiped: true },
    },
  ],
};
