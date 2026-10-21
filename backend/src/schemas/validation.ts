import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  owner: z.string().min(2, 'Owner must be at least 2 characters'),
  methodology: z.string().min(2, 'Methodology is required'),
  geojson: z.record(z.string(), z.any()).refine((val) => {
    // Basic structural check for GeoJSON Polygon or Feature
    if (val.type === 'Polygon' && Array.isArray(val.coordinates)) return true;
    if (
      val.type === 'Feature' &&
      val.geometry &&
      val.geometry.type === 'Polygon' &&
      Array.isArray(val.geometry.coordinates)
    ) {
      return true;
    }
    return false;
  }, 'Invalid GeoJSON: must be a Polygon or Feature with Polygon geometry'),
  pddHash: z.string().min(6, 'PDD document hash is required'),
  pricePerTonneUsd: z.number().positive().optional().default(25.0),
});

export const auditProjectSchema = z.object({
  auditorId: z.string().min(1, 'Auditor ID is required'),
  approve: z.boolean(),
  netTonnage: z.number().int().positive().optional(),
  bufferPct: z.number().min(0).max(100).optional().default(15.0),
  notes: z.string().optional().default('Audited and verified according to standard methodology.'),
});

export const footprintSchema = z.object({
  electricityKwh: z.number().min(0).optional().default(0),
  fuelLiters: z.number().min(0).optional().default(0),
  freightTkm: z.number().min(0).optional().default(0),
});

export const createOrderSchema = z.object({
  buyerId: z.string().min(1, 'Buyer ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1 ton'),
});
