/**
 * ClimateTrust API client.
 * When VITE_USE_MOCK=true, returns deterministic mock data.
 * When false, calls the real backend at VITE_API_URL.
 */
import type {
  Project, AnalysisResult, AuditRequest, AuditResult,
  CatalogItem, FootprintRequest, FootprintResult,
  OrderRequest, Order, PaymentResult, ProjectTimeline, SerialInfo,
} from './types';
import {
  MOCK_PROJECTS, MOCK_ANALYSIS, MOCK_AUDIT_RESULT,
  MOCK_CATALOG, MOCK_FOOTPRINT, MOCK_ORDER, MOCK_PAYMENT,
  MOCK_PROJECT_TIMELINE, MOCK_SERIAL_INFO, MOCK_NDVI_SERIES,
} from './mocks';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ---------- helpers ----------

function delay(ms = 600): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `HTTP ${res.status}`);
    (err as any).status = res.status;
    (err as any).body = body;
    throw err;
  }
  return res.json();
}

// ---------- Projects ----------

export async function listProjects(): Promise<Project[]> {
  if (USE_MOCK) { await delay(); return [...MOCK_PROJECTS]; }
  return request('/projects');
}

export async function getProject(id: string): Promise<Project> {
  if (USE_MOCK) {
    await delay();
    const p = MOCK_PROJECTS.find((p) => p.id === id);
    if (!p) throw new Error('Project not found');
    return { ...p };
  }
  return request(`/projects/${id}`);
}

export async function createProject(data: {
  name: string; owner: string; methodology: string;
  geojson: any; pddHash: string; pricePerTonneUsd?: number;
}): Promise<{ id: string; status: string; areaHa: number }> {
  if (USE_MOCK) {
    await delay(800);
    return { id: 'proj_' + Date.now().toString(36), status: 'DRAFT', areaHa: 480.5 };
  }
  return request('/projects', { method: 'POST', body: JSON.stringify(data) });
}

// ---------- dMRV Analysis ----------

export async function analyzeProject(id: string): Promise<AnalysisResult> {
  if (USE_MOCK) {
    await delay(1500); // simulate satellite processing
    return { ...MOCK_ANALYSIS, ndviSeries: [...MOCK_NDVI_SERIES] };
  }
  return request(`/projects/${id}/analyze`, { method: 'POST' });
}

// ---------- Audit ----------

export async function auditProject(id: string, data: AuditRequest): Promise<AuditResult> {
  if (USE_MOCK) {
    await delay(1200);
    return {
      ...MOCK_AUDIT_RESULT,
      vc: {
        ...MOCK_AUDIT_RESULT.vc,
        credentialSubject: {
          ...MOCK_AUDIT_RESULT.vc.credentialSubject,
          projectId: id,
          netTonnage: data.netTonnage,
          bufferPct: data.bufferPct,
        },
      },
    };
  }
  return request(`/projects/${id}/audit`, { method: 'POST', body: JSON.stringify(data) });
}

// ---------- Catalog ----------

export async function getCatalog(): Promise<CatalogItem[]> {
  if (USE_MOCK) { await delay(); return [...MOCK_CATALOG]; }
  return request('/catalog');
}

// ---------- Footprint ----------

export async function calculateFootprint(data: FootprintRequest): Promise<FootprintResult> {
  if (USE_MOCK) {
    await delay(400);
    // deterministic calculation matching backend factors
    const elec = data.electricityKwh * 0.5;
    const fuel = data.fuelLiters * 2.68;
    const freight = data.freightTkm * 0.1;
    const totalKg = elec + fuel + freight;
    return {
      tco2e: Math.round(totalKg / 10) / 100,
      totalKgCO2: Math.round(totalKg * 10) / 10,
      breakdown: {
        electricityKg: Math.round(elec * 10) / 10,
        fuelKg: Math.round(fuel * 10) / 10,
        freightKg: Math.round(freight * 10) / 10,
      },
    };
  }
  return request('/footprint', { method: 'POST', body: JSON.stringify(data) });
}

// ---------- Orders ----------

export async function createOrder(data: OrderRequest): Promise<Order> {
  if (USE_MOCK) {
    await delay(800);
    const item = MOCK_CATALOG.find((c) => c.projectId === data.projectId);
    return {
      ...MOCK_ORDER,
      orderId: 'ord_' + Date.now().toString(36),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      totalUsd: (item?.pricePerTonneUsd ?? 28) * data.quantity,
    };
  }
  return request('/orders', { method: 'POST', body: JSON.stringify(data) });
}

export async function payOrder(orderId: string): Promise<PaymentResult> {
  if (USE_MOCK) {
    await delay(1500);
    return { ...MOCK_PAYMENT, certificateUrl: `/api/orders/${orderId}/certificate` };
  }
  return request(`/orders/${orderId}/pay`, { method: 'POST' });
}

export function getCertificateUrl(orderId: string): string {
  return `${API_URL}/orders/${orderId}/certificate`;
}

// ---------- Explorer ----------

export async function getProjectTimeline(id: string): Promise<ProjectTimeline> {
  if (USE_MOCK) {
    await delay();
    return { ...MOCK_PROJECT_TIMELINE, projectId: id };
  }
  return request(`/explorer/project?q=${encodeURIComponent(id.trim())}`);
}

export async function getSerialInfo(tokenId: string, serial: number): Promise<SerialInfo> {
  if (USE_MOCK) {
    await delay();
    return { ...MOCK_SERIAL_INFO, tokenId, serial };
  }
  return request(`/explorer/serial/${tokenId}/${serial}`);
}
