/**
 * Supported Hedera network environments.
 */
export type HederaNetwork = 'testnet' | 'mainnet' | 'previewnet' | 'local-node';

/**
 * Supported cryptographic key types for Hedera accounts.
 */
export type KeyType = 'ED25519' | 'ECDSA';

/**
 * Configuration options loaded from environment variables.
 */
export interface HederaConfig {
  network: HederaNetwork;
  operatorId: string;
  operatorKey: string;
  operatorKeyType: KeyType;
  topicId1?: string;
  topicId2?: string;
  topicId3?: string;
  mirrorNodeUrl?: string;
}

/**
 * Standard W3C Verifiable Credential interface.
 */
export interface VC {
  '@context': string | string[];
  id?: string;
  type: string | string[];
  issuer: string | { id: string; [key: string]: unknown };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: Record<string, unknown>;
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws?: string;
    proofValue?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Parameters for creating an NFT class (Token Create via HTS).
 */
export interface CreateNftClassParams {
  name: string;
  symbol: string;
  maxSupply: number;
}

/**
 * Result returned when submitting a message to an HCS topic.
 */
export interface SubmitMessageResult {
  sequence: number;
  txId: string;
}

/**
 * Decentralized Identifier (DID) keypair representation.
 */
export interface DidKeypair {
  did: string;
  publicKeyHex: string;
  privateKeyHex: string;
}

/**
 * Single consensus message retrieved from a topic via Mirror Node.
 */
export interface TopicMessageItem {
  sequence: number;
  consensusTimestamp: string;
  message: any;
}

/**
 * Detailed NFT information retrieved from Mirror Node.
 */
export interface NftInfoResult {
  owner: string | null;
  deleted: boolean;
  metadata: string;
}
