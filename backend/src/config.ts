import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  useMocks: process.env.USE_MOCKS !== 'false',
  databasePath: process.env.DATABASE_PATH || 'climatetrust.db',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  dmrvUrl: process.env.DMRV_URL || 'http://localhost:8001',
  hederaNetwork: process.env.HEDERA_NETWORK || 'testnet',
  mirrorUrl: process.env.MIRROR_URL || 'https://testnet.mirrornode.hedera.com',

  // Hedera Accounts & Keys
  operatorId: process.env.OPERATOR_ID || '0.0.123456',
  operatorKey: process.env.OPERATOR_KEY || '302e020100300506032b6570042204200000000000000000000000000000000000000000000000000000000000000000',
  treasuryId: process.env.TREASURY_ID || '0.0.123456',
  treasuryKey: process.env.TREASURY_KEY || '302e020100300506032b6570042204200000000000000000000000000000000000000000000000000000000000000000',
  buyerId: process.env.BUYER_ID || '0.0.900123',
  buyerKey: process.env.BUYER_KEY || '302e020100300506032b6570042204200000000000000000000000000000000000000000000000000000000000000000',
  auditorId: process.env.AUDITOR_ID || '0.0.800456',
  auditorKey: process.env.AUDITOR_KEY || '302e020100300506032b6570042204200000000000000000000000000000000000000000000000000000000000000000',
  supplyKey: process.env.SUPPLY_KEY || '302e020100300506032b6570042204200000000000000000000000000000000000000000000000000000000000000000',
  wipeKey: process.env.WIPE_KEY || '302e020100300506032b6570042204200000000000000000000000000000000000000000000000000000000000000000',

  // HCS Topic IDs
  topicProject: process.env.TOPIC_PROJECT || '0.0.5001',
  topicAudit: process.env.TOPIC_AUDIT || '0.0.5002',
  topicRetirement: process.env.TOPIC_RETIREMENT || '0.0.5003',

  // Footprint Calculation Factors (Emission Factors)
  footprintFactors: {
    electricityKgPerKwh: 0.5,
    dieselKgPerLiter: 2.68,
    freightKgPerTkm: 0.1,
  },

  // Order Expiration in milliseconds (15 minutes)
  orderLockTimeoutMs: 15 * 60 * 1000,
};
