import { notImplemented } from './errors';

/**
 * Submits a JSON-serializable object as a message to an HCS topic.
 *
 * @param topicId The Hedera Consensus Service topic ID.
 * @param obj The payload object to serialize and submit.
 * @returns An object containing the consensus sequence number and transaction ID.
 */
export async function submitMessage(
  topicId: string,
  obj: object
): Promise<{ sequence: number; txId: string }> {
  void topicId;
  void obj;
  return notImplemented('submitMessage');
}
