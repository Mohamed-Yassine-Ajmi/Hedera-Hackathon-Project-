// ClimateTrust shared types — matches the REST API contract exactly.

export type ProjectStatus = 'DRAFT' | 'ANALYZED' | 'LISTED' | 'SOLD_OUT';
export type OrderStatus = 'LOCKED' | 'RETIRED';

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface Project {
  id: string;
  name: string;
  owner: string;
  methodology: string;
  geojson: GeoJsonPolygon;
  pddHash: string;
  area_ha: number;
  status: ProjectStatus;
  token_id?: string;
  total_tonnage?: number;
  price_per_tonne_usd?: number;
  ndvi_mean?: number;
  created_at: string;
}

export interface AnalysisResult {
  ndviMean: number;
  areaHa: number;
  tco2e: number;
  reportHash: string;
  hcsSeq: number;
  status: 'ANALYZED';
  ndviSeries?: NdviPoint[];
}

export interface NdviPoint {
  date: string;
  value: number;
}

export interface AuditRequest {
  auditorId: string;
  approve: boolean;
  netTonnage: number;
  bufferPct: number;
  notes: string;
}

export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    projectId: string;
    reportHash: string;
    grossTco2e: number;
    bufferPct: number;
    netTonnage: number;
    decision: string;
  };
  proof: {
    type: string;
    created: string;
    proofValue: string;
  };
}

export interface AuditResult {
  vc: VerifiableCredential;
  tokenId: string;
  serials: number[];
  txIds: string[];
  status: 'LISTED';
}

export interface CatalogItem {
  projectId: string;
  name: string;
  tokenId: string;
  availableSerials: number;
  pricePerTonneUsd: number;
  ndviMean: number;
  status: ProjectStatus;
}

export interface FootprintRequest {
  electricityKwh: number;
  fuelLiters: number;
  freightTkm: number;
}

export interface FootprintResult {
  tco2e: number;
  totalKgCO2: number;
  breakdown: {
    electricityKg: number;
    fuelKg: number;
    freightKg: number;
  };
}

export interface OrderRequest {
  buyerId: string;
  projectId: string;
  quantity: number;
}

export interface Order {
  orderId: string;
  status: OrderStatus;
  expiresAt: string;
  totalUsd: number;
}

export interface PaymentResult {
  status: 'RETIRED';
  serials: number[];
  wipeTxId: string;
  hcsSeq: number;
  certificateUrl: string;
}

export interface ExplorerEvent {
  type: string;
  consensusTimestamp: string;
  txId: string;
  hashscanUrl: string;
  data: Record<string, unknown>;
}

export interface ProjectTimeline {
  projectId: string;
  name: string;
  status: ProjectStatus;
  tokenId?: string;
  events: ExplorerEvent[];
}

export interface SerialInfo {
  tokenId: string;
  serial: number;
  owner: string | null;
  deleted: boolean;
  events: ExplorerEvent[];
}
