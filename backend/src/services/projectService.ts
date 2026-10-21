import * as turf from '@turf/turf';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { hederaClient } from '../adapters/hederaClient.js';
import { config } from '../config.js';

export function normalizePolygon(geo: any): any {
  if (geo.type === 'Feature' && geo.geometry?.coordinates) {
    return turf.polygon(geo.geometry.coordinates);
  }
  if (geo.type === 'Polygon' && Array.isArray(geo.coordinates)) {
    return turf.polygon(geo.coordinates);
  }
  throw new Error('Invalid GeoJSON geometry for parcel');
}

export async function createProject(data: {
  name: string;
  owner: string;
  methodology: string;
  geojson: any;
  pddHash: string;
  pricePerTonneUsd?: number;
}): Promise<{ id: string; status: string; areaHa: number }> {
  const db = getDb();
  const newPolygon = normalizePolygon(data.geojson);

  // Compute area in hectares (1 hectare = 10,000 square meters)
  const areaSqm = turf.area(newPolygon);
  const areaHa = Number((areaSqm / 10000).toFixed(2));

  if (areaHa <= 0) {
    throw new Error('Project parcel area must be greater than zero');
  }

  // Check for spatial overlaps with all existing parcels in database
  const existingProjects = db
    .prepare('SELECT id, name, geojson FROM projects')
    .all() as Array<{ id: string; name: string; geojson: string }>;

  for (const existing of existingProjects) {
    try {
      const existingGeo = JSON.parse(existing.geojson);
      const existingPolygon = normalizePolygon(existingGeo);

      const fc = turf.featureCollection([newPolygon, existingPolygon]);
      const intersection = (turf.intersect as any)(fc);

      if (intersection) {
        const overlapAreaSqm = turf.area(intersection);
        if (overlapAreaSqm > 1.0) {
          // Greater than 1 square meter overlap
          const error: any = new Error(
            `Parcel overlaps with existing project "${existing.name}" (${existing.id})`
          );
          error.status = 409;
          error.conflictingProjectId = existing.id;
          throw error;
        }
      }
    } catch (err: any) {
      if (err.status === 409) throw err;
      // Skip parsing errors for corrupted historical polygons
    }
  }

  // Store PDD hash on Hedera File Service (HFS)
  const hfsFileId = await hederaClient.storeHashOnHfs(data.pddHash);

  const id = `proj_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
  const now = new Date().toISOString();

  // Submit registration event to HCS topic ct.project
  await hederaClient.submitMessage(config.topicProject, {
    schema_version: '1.0',
    message_type: 'project.registered',
    project_id: id,
    name: data.name,
    owner: data.owner,
    area_ha: areaHa,
    pdd_hash: data.pddHash,
    hfs_file_id: hfsFileId,
    timestamp: now,
  });

  const stmt = db.prepare(`
    INSERT INTO projects (
      id, name, owner, methodology, geojson, area_ha, pdd_hash, hfs_file_id,
      status, token_id, total_tonnage, price_per_tonne_usd, ndvi_mean, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', NULL, NULL, ?, NULL, ?, ?)
  `);

  stmt.run(
    id,
    data.name,
    data.owner,
    data.methodology,
    JSON.stringify(data.geojson),
    areaHa,
    data.pddHash,
    hfsFileId,
    data.pricePerTonneUsd || 25.0,
    now,
    now
  );

  return {
    id,
    status: 'DRAFT',
    areaHa,
  };
}

export function getAllProjects() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, name, owner, methodology, geojson, area_ha, pdd_hash, hfs_file_id, status, token_id, total_tonnage, price_per_tonne_usd, ndvi_mean, created_at, updated_at
       FROM projects ORDER BY created_at DESC`
    )
    .all() as any[];

  return rows.map((p) => {
    let geojson = p.geojson;
    if (typeof geojson === 'string') {
      try {
        geojson = JSON.parse(geojson);
      } catch {
        // Keep raw string if parsing fails
      }
    }
    return {
      ...p,
      geojson,
      pddHash: p.pdd_hash || '',
      areaHa: p.area_ha,
    };
  });
}

export function getProjectById(id: string) {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
  if (!project) return null;

  try {
    project.geojson = JSON.parse(project.geojson);
  } catch {
    // Keep raw if parse fails
  }

  const reports = db.prepare('SELECT * FROM reports WHERE project_id = ? ORDER BY created_at DESC').all(id);
  const audit = db.prepare('SELECT * FROM audits WHERE project_id = ?').get(id);

  return {
    ...project,
    pddHash: project.pdd_hash || '',
    areaHa: project.area_ha,
    reports,
    audit,
  };
}
