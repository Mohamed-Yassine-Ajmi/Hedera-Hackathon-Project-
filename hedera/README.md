# Hedera Hashgraph Integration Module

This module provides the dedicated Hedera blockchain integration layer for the project. It encapsulates interactions with the Hedera Consensus Service (HCS), Hedera File Service (HFS), Hedera Token Service (HTS), Decentralized Identifiers (DID), Verifiable Credentials (VC), and the Hedera Mirror Node.

---

## 1. Directory Structure

```text
hedera/
├── src/
│   ├── index.ts          # Public entry point exporting exact API & types
│   ├── client.ts         # Hedera SDK Client lifecycle management
│   ├── config.ts         # Environment configuration parser & validator
│   ├── errors.ts         # HederaError class & machine-readable error codes
│   ├── topics.ts         # HCS topic creation
│   ├── messages.ts       # HCS message submission
│   ├── hfs.ts            # HFS hash storage
│   ├── credentials.ts    # DID keypair generation, VC signing & verification
│   ├── nft.ts            # HTS NFT class creation, minting, association, transfer, wipe
│   ├── mirror.ts         # Mirror Node REST API queries & Hashscan URL helper
│   └── types.ts          # W3C VC, configuration, and DTO types
├── scripts/
│   ├── setup.ts          # Environment and account readiness check
│   └── demo.ts           # Demo executing public API error handling
├── tests/
│   └── index.test.ts     # Automated unit tests validating API surface & errors
├── README.md             # Module documentation
└── .env.example          # Environment variable template
```

---

## 2. Public API

Exported from `hedera/src/index.ts`:

### Consensus Service (HCS)
- `createTopic(memo: string): Promise<string>`
- `submitMessage(topicId: string, obj: object): Promise<{ sequence: number; txId: string }>`

### File Service (HFS)
- `storeHashOnHfs(hashHex: string): Promise<string>`

### Token Service (HTS - NFTs)
- `createNftClass(p: { name: string; symbol: string; maxSupply: number }): Promise<string>`
- `mintSerials(tokenId: string, count: number, metadataStr: string): Promise<number[]>`
- `associateToken(accountId: string, privateKey: string, tokenId: string): Promise<string>`
- `transferSerials(tokenId: string, serials: number[], toAccountId: string): Promise<string>`
- `wipeSerials(tokenId: string, fromAccountId: string, serials: number[]): Promise<string>`

### Identity & Verifiable Credentials (DID / VC)
- `generateDidKeypair(): { did: string; publicKeyHex: string; privateKeyHex: string }`
- `signVC(payload: object, privateKeyHex: string): VC`
- `verifyVC(vc: VC): boolean`

### Mirror Node & Utilities
- `getTopicMessages(topicId: string): Promise<Array<{ sequence: number; consensusTimestamp: string; message: any }>>`
- `getNftInfo(tokenId: string, serial: number): Promise<{ owner: string | null; deleted: boolean; metadata: string }>`
- `hashscanUrl(txId: string): string`

### Error Handling
All functions throw `HederaError`, containing:
- `code: HederaErrorCode` (e.g. `'NOT_IMPLEMENTED'`, `'CONFIG_ERROR'`, `'CLIENT_ERROR'`)
- `message: string`
- `details?: unknown`

During Milestone 1, all unimplemented methods throw `HederaError` with code `'NOT_IMPLEMENTED'`.

---

## 3. Configuration & Security

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate the required variables:
   - `HEDERA_NETWORK`: `testnet` (default)
   - `OPERATOR_ID`: Your Hedera Account ID (`0.0.xxxxxx`)
   - `OPERATOR_KEY`: Your Private Key in DER or HEX
   - `OPERATOR_KEY_TYPE`: `ED25519` or `ECDSA`
   - `TOPIC_ID_1`, `TOPIC_ID_2`, `TOPIC_ID_3`: Reserved for your HCS topics

> **CRITICAL SECURITY RULES:**
> - Never commit `.env` or private keys to Git.
> - `.gitignore` is configured to prevent accidental leakage.
> - Never import this module or expose private keys inside frontend client bundles.

---

## 4. Verification Commands

```bash
# Type check without emitting files
npm run typecheck

# Build TypeScript to dist/
npm run build

# Run unit tests
npm test

# Run setup diagnostic check
npm run setup

# Run demo
npm run demo
```
