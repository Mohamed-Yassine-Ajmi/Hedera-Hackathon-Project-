/**
 * Setup and environment verification script.
 *
 * This script checks your local configuration and environment variables
 * to ensure prerequisites are satisfied before future milestones.
 *
 * NOTE: This script does NOT create accounts or submit transactions on-chain.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getHederaConfig } from '../src/config';
import { HederaError } from '../src/errors';

function runSetupCheck() {
  console.log('='.repeat(60));
  console.log(' Hedera Integration Module - Setup & Environment Check');
  console.log('='.repeat(60));

  const rootEnvPath = path.resolve(process.cwd(), '.env');
  const moduleEnvPath = path.resolve(__dirname, '../.env');
  const hasEnv = fs.existsSync(rootEnvPath) || fs.existsSync(moduleEnvPath);

  console.log(`\n1. Environment File Check:`);
  if (hasEnv) {
    console.log(`   [OK] .env file detected.`);
  } else {
    console.log(`   [!] No .env file found. Please copy .env.example to .env and configure your credentials.`);
  }

  console.log(`\n2. Configuration Variables Check:`);
  try {
    const config = getHederaConfig();
    console.log(`   [OK] Network:            ${config.network}`);
    console.log(`   [OK] Operator ID:        ${config.operatorId}`);
    console.log(`   [OK] Operator Key:       ${config.operatorKey.substring(0, 6)}... (hidden for security)`);
    console.log(`   [OK] Operator Key Type:  ${config.operatorKeyType}`);
    console.log(`   [-] Topic 1:             ${config.topicId1 || '(not set yet)'}`);
    console.log(`   [-] Topic 2:             ${config.topicId2 || '(not set yet)'}`);
    console.log(`   [-] Topic 3:             ${config.topicId3 || '(not set yet)'}`);
  } catch (err) {
    if (err instanceof HederaError) {
      console.log(`   [WARNING] ${err.message}`);
    } else {
      console.log(`   [ERROR] ${String(err)}`);
    }
  }

  console.log(`\n3. Next Steps Checklist:`);
  console.log(`   - If you don't have a Hedera Testnet account, visit https://portal.hedera.com`);
  console.log(`   - Copy your Account ID and Private Key into .env`);
  console.log(`   - Never commit .env to version control`);
  console.log(`   - All API endpoints are defined and ready for Milestone 2 implementation.`);
  console.log('='.repeat(60));
}

runSetupCheck();
