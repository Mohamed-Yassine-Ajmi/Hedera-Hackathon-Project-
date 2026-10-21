import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';
import { getHederaConfig } from './config';
import { HederaError } from './errors';

let cachedClient: Client | null = null;

/**
 * Initializes or returns a singleton Hedera Client based on environment configuration.
 * Note: Actual network connection and transactions are reserved for future milestones.
 */
export function getHederaClient(): Client {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getHederaConfig();

  try {
    let client: Client;
    switch (config.network) {
      case 'mainnet':
        client = Client.forMainnet();
        break;
      case 'previewnet':
        client = Client.forPreviewnet();
        break;
      case 'testnet':
      default:
        client = Client.forTestnet();
        break;
    }

    const operatorAccountId = AccountId.fromString(config.operatorId);
    const operatorPrivateKey =
      config.operatorKeyType === 'ECDSA'
        ? PrivateKey.fromStringECDSA(config.operatorKey)
        : PrivateKey.fromStringED25519(config.operatorKey);

    client.setOperator(operatorAccountId, operatorPrivateKey);
    cachedClient = client;
    return cachedClient;
  } catch (error) {
    throw new HederaError(
      'CLIENT_ERROR',
      `Failed to initialize Hedera Client: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}

/**
 * Closes the active client connection if initialized.
 */
export async function closeHederaClient(): Promise<void> {
  if (cachedClient) {
    cachedClient.close();
    cachedClient = null;
  }
}
