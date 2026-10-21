import { notImplemented } from './errors';

/**
 * Retrieves historical consensus messages from an HCS topic via Mirror Node REST API.
 *
 * @param topicId The Topic ID to query.
 * @returns Array of message objects with sequence number, consensus timestamp, and message payload.
 */
export async function getTopicMessages(topicId: string): Promise<
  Array<{
    sequence: number;
    consensusTimestamp: string;
    message: any;
  }>
> {
  void topicId;
  return notImplemented('getTopicMessages');
}

/**
 * Queries information about a specific NFT serial via the Mirror Node REST API.
 *
 * @param tokenId The Token ID.
 * @param serial The serial number of the NFT.
 * @returns Object with owner account ID, deleted flag, and metadata string.
 */
export async function getNftInfo(
  tokenId: string,
  serial: number
): Promise<{
  owner: string | null;
  deleted: boolean;
  metadata: string;
}> {
  void tokenId;
  void serial;
  return notImplemented('getNftInfo');
}

/**
 * Generates the Hashscan explorer URL for a given Hedera transaction ID.
 *
 * @param txId The Hedera transaction ID (e.g., "0.0.12345@1600000000.000000000" or normalized format).
 * @returns Hashscan web explorer URL.
 */
export function hashscanUrl(txId: string): string {
  void txId;
  return notImplemented('hashscanUrl');
}
