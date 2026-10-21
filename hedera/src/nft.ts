import { notImplemented } from './errors';

/**
 * Creates a new Non-Fungible Token (NFT) class using the Hedera Token Service (HTS).
 *
 * @param p Object containing token name, symbol, and maximum supply.
 * @returns The newly created Token ID (e.g., "0.0.98765").
 */
export async function createNftClass(p: {
  name: string;
  symbol: string;
  maxSupply: number;
}): Promise<string> {
  void p;
  return notImplemented('createNftClass');
}

/**
 * Mints one or more unique serials of an existing NFT token class.
 *
 * @param tokenId The HTS Token ID.
 * @param count The number of serials to mint.
 * @param metadataStr Metadata string or URI associated with the serial(s).
 * @returns Array of newly minted serial numbers.
 */
export async function mintSerials(
  tokenId: string,
  count: number,
  metadataStr: string
): Promise<number[]> {
  void tokenId;
  void count;
  void metadataStr;
  return notImplemented('mintSerials');
}

/**
 * Associates an account with a token to permit transfers and ownership.
 *
 * @param accountId The Hedera Account ID to associate.
 * @param privateKey The private key of the account to sign association.
 * @param tokenId The Token ID to associate.
 * @returns The transaction ID of the association.
 */
export async function associateToken(
  accountId: string,
  privateKey: string,
  tokenId: string
): Promise<string> {
  void accountId;
  void privateKey;
  void tokenId;
  return notImplemented('associateToken');
}

/**
 * Transfers specific NFT serial numbers from the operator or treasury to another account.
 *
 * @param tokenId The Token ID.
 * @param serials Array of serial numbers to transfer.
 * @param toAccountId Recipient account ID.
 * @returns The transaction ID of the transfer.
 */
export async function transferSerials(
  tokenId: string,
  serials: number[],
  toAccountId: string
): Promise<string> {
  void tokenId;
  void serials;
  void toAccountId;
  return notImplemented('transferSerials');
}

/**
 * Wipes specific serial numbers of a token from an account balance (compliance/revocation).
 *
 * @param tokenId The Token ID.
 * @param fromAccountId The account ID holding the serials.
 * @param serials Array of serial numbers to wipe.
 * @returns The transaction ID of the wipe operation.
 */
export async function wipeSerials(
  tokenId: string,
  fromAccountId: string,
  serials: number[]
): Promise<string> {
  void tokenId;
  void fromAccountId;
  void serials;
  return notImplemented('wipeSerials');
}
