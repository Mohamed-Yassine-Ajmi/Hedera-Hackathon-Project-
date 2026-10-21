import { notImplemented } from './errors';

/**
 * Creates a new Hedera Consensus Service (HCS) topic with the given memo.
 *
 * @param memo Description or identifier for the topic.
 * @returns The newly created Topic ID (e.g., "0.0.12345").
 */
export async function createTopic(memo: string): Promise<string> {
  // Avoid unused parameter warning in strict TS
  void memo;
  return notImplemented('createTopic');
}
