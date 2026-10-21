/**
 * Demo script demonstrating the Hedera module public API surface.
 *
 * For this milestone, invoking unimplemented functions safely throws
 * a typed `HederaError` with code `NOT_IMPLEMENTED`.
 */

import {
  createTopic,
  submitMessage,
  storeHashOnHfs,
  createNftClass,
  mintSerials,
  associateToken,
  transferSerials,
  wipeSerials,
  generateDidKeypair,
  signVC,
  verifyVC,
  getTopicMessages,
  getNftInfo,
  hashscanUrl,
  HederaError,
} from '../src/index';

async function runDemo() {
  console.log('='.repeat(65));
  console.log(' Hedera Integration Module - Public API Demo (Milestone 1)');
  console.log('='.repeat(65));

  const operations: Array<{ name: string; action: () => Promise<unknown> | unknown }> = [
    { name: 'createTopic', action: () => createTopic('test-topic') },
    { name: 'submitMessage', action: () => submitMessage('0.0.123', { test: true }) },
    { name: 'storeHashOnHfs', action: () => storeHashOnHfs('0xabcdef') },
    { name: 'createNftClass', action: () => createNftClass({ name: 'Badge', symbol: 'BDG', maxSupply: 100 }) },
    { name: 'mintSerials', action: () => mintSerials('0.0.456', 1, 'ipfs://...') },
    { name: 'associateToken', action: () => associateToken('0.0.789', 'key', '0.0.456') },
    { name: 'transferSerials', action: () => transferSerials('0.0.456', [1], '0.0.789') },
    { name: 'wipeSerials', action: () => wipeSerials('0.0.456', '0.0.789', [1]) },
    { name: 'generateDidKeypair', action: () => generateDidKeypair() },
    {
      name: 'signVC',
      action: () =>
        signVC(
          { sub: 'did:hedera:testnet:0.0.123' },
          '302e020100300506032b657004220420...'
        ),
    },
    {
      name: 'verifyVC',
      action: () =>
        verifyVC({
          '@context': 'https://www.w3.org/2018/credentials/v1',
          type: ['VerifiableCredential'],
          issuer: 'did:hedera:testnet:0.0.123',
          issuanceDate: new Date().toISOString(),
          credentialSubject: { id: 'did:hedera:testnet:0.0.456' },
        }),
    },
    { name: 'getTopicMessages', action: () => getTopicMessages('0.0.123') },
    { name: 'getNftInfo', action: () => getNftInfo('0.0.456', 1) },
    { name: 'hashscanUrl', action: () => hashscanUrl('0.0.123@1600000000.000000000') },
  ];

  console.log(`\nVerifying that all ${operations.length} API functions throw typed NOT_IMPLEMENTED errors:`);

  let count = 0;
  for (const op of operations) {
    try {
      await op.action();
      console.error(`   [FAIL] ${op.name} did not throw NOT_IMPLEMENTED.`);
    } catch (err) {
      if (err instanceof HederaError && err.code === 'NOT_IMPLEMENTED') {
        count++;
        console.log(`   [OK] ${op.name} correctly threw HederaError(NOT_IMPLEMENTED)`);
      } else {
        console.error(`   [FAIL] ${op.name} threw unexpected error:`, err);
      }
    }
  }

  console.log(`\nResult: ${count}/${operations.length} API methods verified successfully.`);
  console.log('='.repeat(65));
}

runDemo().catch(console.error);
