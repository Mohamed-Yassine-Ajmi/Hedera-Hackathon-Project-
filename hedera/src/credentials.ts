import { notImplemented } from './errors';
import { VC } from './types';

/**
 * Generates a DID keypair and identifier compliant with Hedera DID specifications.
 *
 * @returns Object containing the DID string, public key hex, and private key hex.
 */
export function generateDidKeypair(): {
  did: string;
  publicKeyHex: string;
  privateKeyHex: string;
} {
  return notImplemented('generateDidKeypair');
}

/**
 * Signs a payload to create a tamper-evident W3C Verifiable Credential.
 *
 * @param payload The data object representing claims and metadata of the VC.
 * @param privateKeyHex The private key hex of the issuer.
 * @returns The signed Verifiable Credential (VC).
 */
export function signVC(payload: object, privateKeyHex: string): VC {
  void payload;
  void privateKeyHex;
  return notImplemented('signVC');
}

/**
 * Verifies the signature and cryptographic integrity of a Verifiable Credential.
 *
 * @param vc The Verifiable Credential to verify.
 * @returns True if valid; false or throws if invalid/tampered.
 */
export function verifyVC(vc: VC): boolean {
  void vc;
  return notImplemented('verifyVC');
}
