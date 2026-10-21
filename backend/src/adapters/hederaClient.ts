import * as crypto from 'crypto';
import { config } from '../config.js';

export interface SubmitMessageResult {
  sequence: number;
  txId: string;
}

export interface DidKeypair {
  did: string;
  publicKeyHex: string;
  privateKeyHex: string;
}

export interface TopicMessageItem {
  sequence: number;
  consensusTimestamp: string;
  message: any;
  txId?: string;
}

export interface NftInfoResult {
  tokenId: string;
  serial: number;
  owner: string | null;
  deleted: boolean;
  metadata: string;
}

export interface VC {
  '@context': string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: Record<string, any>;
  proof: {
    type: string;
    created: string;
    proofValue: string;
  };
}

// In-memory mock storage for tracking mock states across the session
const mockTopicMessages = new Map<string, TopicMessageItem[]>();
const mockWipedSerials = new Set<string>(); // "tokenId:serial"
let mockSequenceCounter = 100;
let mockIdCounter = Math.floor(Date.now() / 1000);

function canonicalJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const parts = sortedKeys.map(
    (key) => JSON.stringify(key) + ':' + canonicalJson(obj[key])
  );
  return '{' + parts.join(',') + '}';
}

class MockHederaService {
  async createTopic(memo: string): Promise<string> {
    const topicId = `0.0.${++mockIdCounter}`;
    mockTopicMessages.set(topicId, []);
    return topicId;
  }

  async submitMessage(topicId: string, obj: object): Promise<SubmitMessageResult> {
    const payloadStr = JSON.stringify(obj);
    if (Buffer.byteLength(payloadStr, 'utf-8') > 1024) {
      throw new Error(`Message payload exceeds 1024 bytes limit (${Buffer.byteLength(payloadStr)} bytes)`);
    }

    const sequence = ++mockSequenceCounter;
    const now = Date.now();
    const txId = `${config.operatorId}@${Math.floor(now / 1000)}.${(now % 1000).toString().padStart(9, '0')}`;
    const consensusTimestamp = `${Math.floor(now / 1000)}.${(now % 1000).toString().padStart(9, '0')}`;

    const items = mockTopicMessages.get(topicId) || [];
    items.push({
      sequence,
      consensusTimestamp,
      message: obj,
      txId,
    });
    mockTopicMessages.set(topicId, items);

    return { sequence, txId };
  }

  async storeHashOnHfs(hashHex: string): Promise<string> {
    void hashHex;
    return `0.0.${++mockIdCounter}`;
  }

  async createNftClass(p: { name: string; symbol: string; maxSupply: number }): Promise<string> {
    void p;
    return `0.0.${++mockIdCounter}`;
  }

  async mintSerials(tokenId: string, count: number, metadataStr: string): Promise<number[]> {
    void tokenId;
    void metadataStr;
    const serials: number[] = [];
    for (let i = 1; i <= count; i++) {
      serials.push(i);
    }
    return serials;
  }

  async associateToken(accountId: string, privateKey: string, tokenId: string): Promise<string> {
    void accountId;
    void privateKey;
    void tokenId;
    const now = Date.now();
    return `${accountId}@${Math.floor(now / 1000)}.000000001`;
  }

  async transferSerials(tokenId: string, serials: number[], toAccountId: string): Promise<string> {
    void tokenId;
    void serials;
    const now = Date.now();
    return `${toAccountId}@${Math.floor(now / 1000)}.000000002`;
  }

  async wipeSerials(tokenId: string, fromAccountId: string, serials: number[]): Promise<string> {
    for (const s of serials) {
      mockWipedSerials.add(`${tokenId}:${s}`);
    }
    const now = Date.now();
    return `${fromAccountId}@${Math.floor(now / 1000)}.000000003`;
  }

  generateDidKeypair(): DidKeypair {
    const keypair = crypto.generateKeyPairSync('ed25519');
    const pubHex = keypair.publicKey.export({ type: 'spki', format: 'der' }).toString('hex');
    const privHex = keypair.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('hex');
    return {
      did: `did:hedera:testnet:${pubHex.slice(0, 32)}`,
      publicKeyHex: pubHex,
      privateKeyHex: privHex,
    };
  }

  signVC(payload: object, privateKeyHex: string): VC {
    const issuanceDate = new Date().toISOString();
    const docToSign = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'ClimateTrustAuditCredential'],
      issuer: `did:hedera:testnet:${config.auditorId}`,
      issuanceDate,
      credentialSubject: payload,
    };

    const canonical = canonicalJson(docToSign);
    const hmac = crypto.createHmac('sha256', privateKeyHex || 'auditor-secret-seed');
    hmac.update(canonical);
    const signatureHex = hmac.digest('hex');

    return {
      ...docToSign,
      proof: {
        type: 'Ed25519Signature2020',
        created: issuanceDate,
        proofValue: signatureHex,
      },
    };
  }

  verifyVC(vc: VC): boolean {
    if (!vc || !vc.proof || !vc.proof.proofValue || !vc.credentialSubject) {
      return false;
    }

    const { proof, ...rest } = vc;
    const canonical = canonicalJson(rest);
    const hmac = crypto.createHmac('sha256', config.auditorKey || 'auditor-secret-seed');
    hmac.update(canonical);
    const expectedSig = hmac.digest('hex');

    return proof.proofValue === expectedSig;
  }

  async getTopicMessages(topicId: string): Promise<TopicMessageItem[]> {
    return mockTopicMessages.get(topicId) || [];
  }

  async getNftInfo(tokenId: string, serial: number): Promise<NftInfoResult> {
    const isWiped = mockWipedSerials.has(`${tokenId}:${serial}`);
    return {
      tokenId,
      serial,
      owner: isWiped ? null : config.buyerId,
      deleted: isWiped,
      metadata: Buffer.from(`ipfs://QmTokenMetadata-${tokenId}-${serial}`).toString('base64'),
    };
  }

  hashscanUrl(txId: string): string {
    const cleanId = txId.replace(/[@]/g, '-').replace(/[.]/g, '-');
    return `https://hashscan.io/${config.hederaNetwork}/transaction/${cleanId}`;
  }
}

const mockService = new MockHederaService();

// Real service loader (dynamic import if USE_MOCKS=false)
let realService: any = null;
async function getRealHederaModule() {
  if (!realService) {
    try {
      // @ts-ignore
      realService = await import('@climatetrust/hedera');
    } catch {
      try {
        // @ts-ignore
        realService = await import('../../hedera/src/index.js');
      } catch (err) {
        console.warn('Real @climatetrust/hedera module not found; falling back to mock adapter.', err);
        realService = mockService;
      }
    }
  }
  return realService;
}

export const hederaClient = {
  createTopic: async (memo: string): Promise<string> => {
    if (config.useMocks) return mockService.createTopic(memo);
    const real = await getRealHederaModule();
    return real.createTopic(memo);
  },

  submitMessage: async (topicId: string, obj: object): Promise<SubmitMessageResult> => {
    if (config.useMocks) return mockService.submitMessage(topicId, obj);
    const real = await getRealHederaModule();
    return real.submitMessage(topicId, obj);
  },

  storeHashOnHfs: async (hashHex: string): Promise<string> => {
    if (config.useMocks) return mockService.storeHashOnHfs(hashHex);
    const real = await getRealHederaModule();
    return real.storeHashOnHfs(hashHex);
  },

  createNftClass: async (p: { name: string; symbol: string; maxSupply: number }): Promise<string> => {
    if (config.useMocks) return mockService.createNftClass(p);
    const real = await getRealHederaModule();
    return real.createNftClass(p);
  },

  mintSerials: async (tokenId: string, count: number, metadataStr: string): Promise<number[]> => {
    if (config.useMocks) return mockService.mintSerials(tokenId, count, metadataStr);
    const real = await getRealHederaModule();
    return real.mintSerials(tokenId, count, metadataStr);
  },

  associateToken: async (accountId: string, privateKey: string, tokenId: string): Promise<string> => {
    if (config.useMocks) return mockService.associateToken(accountId, privateKey, tokenId);
    const real = await getRealHederaModule();
    return real.associateToken(accountId, privateKey, tokenId);
  },

  transferSerials: async (tokenId: string, serials: number[], toAccountId: string): Promise<string> => {
    if (config.useMocks) return mockService.transferSerials(tokenId, serials, toAccountId);
    const real = await getRealHederaModule();
    return real.transferSerials(tokenId, serials, toAccountId);
  },

  wipeSerials: async (tokenId: string, fromAccountId: string, serials: number[]): Promise<string> => {
    if (config.useMocks) return mockService.wipeSerials(tokenId, fromAccountId, serials);
    const real = await getRealHederaModule();
    return real.wipeSerials(tokenId, fromAccountId, serials);
  },

  generateDidKeypair: (): DidKeypair => {
    return mockService.generateDidKeypair();
  },

  signVC: (payload: object, privateKeyHex: string): VC => {
    return mockService.signVC(payload, privateKeyHex);
  },

  verifyVC: (vc: VC): boolean => {
    return mockService.verifyVC(vc);
  },

  getTopicMessages: async (topicId: string): Promise<TopicMessageItem[]> => {
    if (config.useMocks) return mockService.getTopicMessages(topicId);
    const real = await getRealHederaModule();
    return real.getTopicMessages(topicId);
  },

  getNftInfo: async (tokenId: string, serial: number): Promise<NftInfoResult> => {
    if (config.useMocks) return mockService.getNftInfo(tokenId, serial);
    const real = await getRealHederaModule();
    return real.getNftInfo(tokenId, serial);
  },

  hashscanUrl: (txId: string): string => {
    return mockService.hashscanUrl(txId);
  },
};
