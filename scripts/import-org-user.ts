import { promises as fs } from 'fs';
import * as path from 'path';
import { Wallets, X509Identity } from 'fabric-network';

async function ensureFile(p: string, label: string) {
  const st = await fs.stat(p).catch(() => null);
  if (!st || !st.isFile()) throw new Error(`Missing ${label}: ${p}`);
}

async function pickPrivateKey(keystoreDir: string): Promise<string> {
  const files = await fs.readdir(keystoreDir);
  if (files.length === 0)
    throw new Error(`No private key found in ${keystoreDir}`);
  if (files.length > 1)
    console.warn(`⚠️ Multiple files in keystore, using first: ${files[0]}`);
  return path.join(keystoreDir, files[0]);
}

function looksLikePemKey(text: string) {
  return (
    text.includes('BEGIN PRIVATE KEY') ||
    text.includes('BEGIN EC PRIVATE KEY') ||
    text.includes('BEGIN RSA PRIVATE KEY')
  );
}

async function main() {
  const testnetRoot = process.env.TESTNET_ROOT;
  if (!testnetRoot) {
    throw new Error(
      'TESTNET_ROOT not set. Example:\nexport TESTNET_ROOT="$HOME/Developer/Diploma/hlf/fabric-samples/test-network"',
    );
  }

  const walletPath = path.resolve(process.cwd(), 'fabric/wallet');
  const userBase = path.join(
    testnetRoot,
    'organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp',
  );
  const certPath = path.join(userBase, 'signcerts', 'cert.pem');
  const keyDir = path.join(userBase, 'keystore');

  console.log('🔎 Paths:\n', { testnetRoot, walletPath, certPath, keyDir });

  await ensureFile(certPath, 'User1 cert');
  const keyPath = await pickPrivateKey(keyDir);
  await ensureFile(keyPath, 'User1 private key');

  const cert = await fs.readFile(certPath, 'utf8');
  const key = await fs.readFile(keyPath, 'utf8');

  if (!looksLikePemKey(key)) {
    throw new Error(
      `File in keystore does not look like a PEM private key: ${keyPath}`,
    );
  }

  await fs.mkdir(walletPath, { recursive: true });
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const identity: X509Identity = {
    credentials: { certificate: cert, privateKey: key },
    mspId: 'Org1MSP',
    type: 'X.509',
  };
  await wallet.put('appUser', identity);
  console.log(`✅ Imported identity "appUser" into wallet: ${walletPath}`);
}

main().catch((err) => {
  console.error('❌ Import failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
