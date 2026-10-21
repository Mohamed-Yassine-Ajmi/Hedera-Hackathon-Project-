import * as dotenv from 'dotenv';
import * as path from 'path';
import { HederaError } from './errors';
import { HederaConfig, HederaNetwork, KeyType } from './types';

// Attempt to load .env from current directory or workspace root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Validates and retrieves the Hedera configuration from process.env.
 * Throws a typed HederaError('CONFIG_ERROR') if mandatory configuration is missing.
 */
export function getHederaConfig(): HederaConfig {
  const network = (process.env.HEDERA_NETWORK || 'testnet').toLowerCase() as HederaNetwork;
  const operatorId = process.env.OPERATOR_ID?.trim();
  const operatorKey = process.env.OPERATOR_KEY?.trim();
  const operatorKeyType = (process.env.OPERATOR_KEY_TYPE?.trim().toUpperCase() || 'ED25519') as KeyType;

  const topicId1 = process.env.TOPIC_ID_1?.trim() || process.env.TOPIC_AUDIT_ID?.trim();
  const topicId2 = process.env.TOPIC_ID_2?.trim() || process.env.TOPIC_EVENTS_ID?.trim();
  const topicId3 = process.env.TOPIC_ID_3?.trim() || process.env.TOPIC_CREDENTIALS_ID?.trim();
  const mirrorNodeUrl = process.env.HEDERA_MIRROR_NODE_URL?.trim();

  const missing: string[] = [];
  if (!operatorId) missing.push('OPERATOR_ID');
  if (!operatorKey) missing.push('OPERATOR_KEY');

  if (missing.length > 0) {
    throw new HederaError(
      'CONFIG_ERROR',
      `Missing required Hedera environment variables: ${missing.join(', ')}. Please configure .env before executing transactions.`
    );
  }

  if (operatorKeyType !== 'ED25519' && operatorKeyType !== 'ECDSA') {
    throw new HederaError(
      'CONFIG_ERROR',
      `Invalid OPERATOR_KEY_TYPE: "${operatorKeyType}". Must be either "ED25519" or "ECDSA".`
    );
  }

  return {
    network,
    operatorId: operatorId as string,
    operatorKey: operatorKey as string,
    operatorKeyType,
    topicId1,
    topicId2,
    topicId3,
    mirrorNodeUrl,
  };
}

/**
 * Checks whether basic configuration variables are present without throwing.
 */
export function isConfigured(): boolean {
  try {
    getHederaConfig();
    return true;
  } catch {
    return false;
  }
}
