import { notImplemented } from './errors';

/**
 * Stores a cryptographic hash string on the Hedera File Service (HFS).
 *
 * @param hashHex The hex-encoded hash string to persist.
 * @returns The File ID (e.g., "0.0.67890") created on HFS.
 */
export async function storeHashOnHfs(hashHex: string): Promise<string> {
  void hashHex;
  return notImplemented('storeHashOnHfs');
}
