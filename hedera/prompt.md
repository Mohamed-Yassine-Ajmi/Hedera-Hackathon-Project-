ROLE: You are a senior Hedera developer. I own the /hedera package of ClimateTrust (see shared context above).

GOAL: Build a TypeScript package exposing exactly the functions listed in the "Hedera module" contract, working on Hedera TESTNET with @hashgraph/sdk, plus a runnable demo script.

PART A: Consensus, files and identity
1. Setup: package.json, tsconfig, a client factory from .env (operator account), and a `scripts/setup.ts` that creates the 3 HCS topics (ct.project, ct.audit, ct.retirement) with a submit key and prints their IDs for .env.
2. submitMessage(topicId, obj): JSON-stringify, check size < 1000 bytes, submit, wait for the receipt, return {sequence, txId}.
3. getTopicMessages(topicId): read from the Mirror Node REST API (/api/v1/topics/{id}/messages), base64-decode, parse JSON, return with consensus_timestamp and sequence number.
4. storeHashOnHfs(hashHex): create a small Hedera File with the hash and a label; return the fileId.
5. generateDidKeypair(): Ed25519 keypair plus a did-like identifier "did:hedera:testnet:<publicKeyHex>". signVC(payload, privateKeyHex): build a W3C-style VC JSON {@context, type, issuer, issuanceDate, credentialSubject: payload, proof: {type: Ed25519Signature2020, created, proofValue}} signed over canonical JSON (sorted keys). verifyVC(vc): returns boolean, and must fail if any field is tampered with.

PART B: Token service
6. createNftClass({name, symbol, maxSupply}): TokenType NonFungibleUnique, finite supply, treasury, with supplyKey, wipeKey and freezeKey as separate keys. Return tokenId.
7. mintSerials(tokenId, count, metadataStr): metadata per NFT must be at most 100 bytes (use an ipfs:// CID or a short string). Mint in batches of about 10 per transaction (check the SDK limits). Return the serial numbers.
8. associateToken(accountId, privateKey, tokenId): required before the buyer can receive NFTs.
9. transferSerials(tokenId, serials, toAccountId): treasury to buyer.
10. wipeSerials(tokenId, fromAccountId, serials): IMPORTANT: wipe cannot be applied to the treasury account, so the serials must be in the buyer's account first. Return the txId.
11. getNftInfo(tokenId, serial) via the Mirror Node (owner, deleted flag, metadata), and hashscanUrl(txId) -> https://hashscan.io/testnet/transaction/...
12. `scripts/demo.ts` that runs the full chain: create topics, create a class with maxSupply 20, mint 20, associate the buyer, transfer 5, wipe 5, submit an HCS retirement message, and print HashScan links at every step. Show how to verify that wiped serials are gone.

DELIVERABLES: complete file tree with all code, .env.example, README with exact commands, and a list of testnet pitfalls (rate limits, fees, mirror node delay of a few seconds, so add a retry/wait helper).
ACCEPTANCE: `npm run demo` completes on testnet with no manual step, and verifyVC returns false on a tampered VC.
Start by listing the files, then give each file in full.