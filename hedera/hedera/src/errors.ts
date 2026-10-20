/**
 * Machine-readable error codes for the Hedera integration module.
 */
export type HederaErrorCode =
  | 'NOT_IMPLEMENTED'
  | 'CONFIG_ERROR'
  | 'CLIENT_ERROR'
  | 'TOPIC_ERROR'
  | 'MESSAGE_ERROR'
  | 'HFS_ERROR'
  | 'NFT_ERROR'
  | 'CREDENTIAL_ERROR'
  | 'MIRROR_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR';

/**
 * Standard typed error for all Hedera module operations.
 * Contains a machine-readable error code and an informative error message.
 */
export class HederaError extends Error {
  public readonly code: HederaErrorCode;
  public readonly details?: unknown;

  constructor(code: HederaErrorCode, message: string, details?: unknown) {
    super(`[HederaError:${code}] ${message}`);
    this.name = 'HederaError';
    this.code = code;
    this.details = details;

    // Restore prototype chain for instanceof checks across boundaries
    Object.setPrototypeOf(this, HederaError.prototype);
  }
}

/**
 * Helper to raise a typed NOT_IMPLEMENTED error.
 */
export function notImplemented(featureName: string): never {
  throw new HederaError(
    'NOT_IMPLEMENTED',
    `Function '${featureName}' is not implemented yet. Implementation is scheduled for subsequent milestones.`
  );
}
