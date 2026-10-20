/**
 * Public Entry Point for the Hedera Hashgraph Integration Module.
 */

// Error handling
export { HederaError, HederaErrorCode } from './errors';

// Types
export {
  VC,
  CreateNftClassParams,
  SubmitMessageResult,
  DidKeypair,
  TopicMessageItem,
  NftInfoResult,
  HederaConfig,
  HederaNetwork,
  KeyType,
} from './types';

// Configuration and client helpers
export { getHederaConfig, isConfigured } from './config';
export { getHederaClient, closeHederaClient } from './client';

// Public API Functions (exact signatures required by specification)
export { createTopic } from './topics';
export { submitMessage } from './messages';
export { storeHashOnHfs } from './hfs';
export {
  createNftClass,
  mintSerials,
  associateToken,
  transferSerials,
  wipeSerials,
} from './nft';
export { generateDidKeypair, signVC, verifyVC } from './credentials';
export { getTopicMessages, getNftInfo, hashscanUrl } from './mirror';
