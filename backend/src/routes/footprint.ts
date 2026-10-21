import { Router, Request, Response, NextFunction } from 'express';
import { footprintSchema } from '../schemas/validation.js';
import { config } from '../config.js';

export const footprintRouter = Router();

// POST /footprint
footprintRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = footprintSchema.parse(req.body);

    const electricityKg = validated.electricityKwh * config.footprintFactors.electricityKgPerKwh;
    const fuelKg = validated.fuelLiters * config.footprintFactors.dieselKgPerLiter;
    const freightKg = validated.freightTkm * config.footprintFactors.freightKgPerTkm;

    const totalKg = electricityKg + fuelKg + freightKg;
    const tco2e = Number((totalKg / 1000).toFixed(2));

    res.json({
      tco2e,
      totalKgCO2: Number(totalKg.toFixed(2)),
      breakdown: {
        electricityKg: Number(electricityKg.toFixed(2)),
        fuelKg: Number(fuelKg.toFixed(2)),
        freightKg: Number(freightKg.toFixed(2)),
      },
    });
  } catch (err) {
    next(err);
  }
});
