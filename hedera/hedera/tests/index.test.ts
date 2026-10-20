import test from 'node:test';
import assert from 'node:assert/strict';

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
  VC,
} from '../src/index';

test('Hedera Module - Public API exports exist and are functions', () => {
  assert.equal(typeof createTopic, 'function');
  assert.equal(typeof submitMessage, 'function');
  assert.equal(typeof storeHashOnHfs, 'function');
  assert.equal(typeof createNftClass, 'function');
  assert.equal(typeof mintSerials, 'function');
  assert.equal(typeof associateToken, 'function');
  assert.equal(typeof transferSerials, 'function');
  assert.equal(typeof wipeSerials, 'function');
  assert.equal(typeof generateDidKeypair, 'function');
  assert.equal(typeof signVC, 'function');
  assert.equal(typeof verifyVC, 'function');
  assert.equal(typeof getTopicMessages, 'function');
  assert.equal(typeof getNftInfo, 'function');
  assert.equal(typeof hashscanUrl, 'function');
});

test('HederaError class behaves correctly with machine-readable codes', () => {
  const err = new HederaError('NOT_IMPLEMENTED', 'Feature not ready', { foo: 'bar' });
  assert.equal(err instanceof Error, true);
  assert.equal(err instanceof HederaError, true);
  assert.equal(err.code, 'NOT_IMPLEMENTED');
  assert.match(err.message, /Feature not ready/);
  assert.deepEqual(err.details, { foo: 'bar' });
});

test('Unimplemented asynchronous functions throw typed NOT_IMPLEMENTED HederaError', async () => {
  const asyncCases: Array<[string, () => Promise<unknown>]> = [
    ['createTopic', () => createTopic('test')],
    ['submitMessage', () => submitMessage('0.0.123', { a: 1 })],
    ['storeHashOnHfs', () => storeHashOnHfs('0x1234')],
    ['createNftClass', () => createNftClass({ name: 'Badge', symbol: 'BDG', maxSupply: 50 })],
    ['mintSerials', () => mintSerials('0.0.123', 1, 'metadata')],
    ['associateToken', () => associateToken('0.0.111', 'privkey', '0.0.222')],
    ['transferSerials', () => transferSerials('0.0.222', [1], '0.0.333')],
    ['wipeSerials', () => wipeSerials('0.0.222', '0.0.333', [1])],
    ['getTopicMessages', () => getTopicMessages('0.0.123')],
    ['getNftInfo', () => getNftInfo('0.0.222', 1)],
  ];

  for (const [name, fn] of asyncCases) {
    await assert.rejects(
      async () => {
        await fn();
      },
      (err: unknown) => {
        assert.ok(err instanceof HederaError, `${name} should throw HederaError`);
        assert.equal((err as HederaError).code, 'NOT_IMPLEMENTED', `${name} should have code NOT_IMPLEMENTED`);
        return true;
      }
    );
  }
});

test('Unimplemented synchronous functions throw typed NOT_IMPLEMENTED HederaError', () => {
  const syncCases: Array<[string, () => unknown]> = [
    ['generateDidKeypair', () => generateDidKeypair()],
    ['signVC', () => signVC({ test: true }, 'dummy-key')],
    [
      'verifyVC',
      () =>
        verifyVC({
          '@context': 'https://www.w3.org/2018/credentials/v1',
          type: ['VerifiableCredential'],
          issuer: 'did:hedera:testnet:0.0.123',
          issuanceDate: '2026-01-01T00:00:00Z',
          credentialSubject: { id: 'did:hedera:testnet:0.0.456' },
        } as VC),
    ],
    ['hashscanUrl', () => hashscanUrl('0.0.123@1600000000.000000000')],
  ];

  for (const [name, fn] of syncCases) {
    assert.throws(
      () => fn(),
      (err: unknown) => {
        assert.ok(err instanceof HederaError, `${name} should throw HederaError`);
        assert.equal((err as HederaError).code, 'NOT_IMPLEMENTED', `${name} should have code NOT_IMPLEMENTED`);
        return true;
      }
    );
  }
});
