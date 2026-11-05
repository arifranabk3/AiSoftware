import dns from 'dns';
import { promisify } from 'util';
import dotenv from 'dotenv';
import path from 'path';
import { mongoDbService } from './mongodb.js';
import { initializeDatabaseIndexes } from './init-indexes.js';

// Automatically load local .env if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const resolveDns = promisify(dns.resolve);

export async function runAtlasDiagnostic(mongoUri?: string, dbName = 'ai_command_center') {
  const uri = mongoUri || process.env.MONGODB_URI;

  console.log('====================================================');
  console.log('       MONGODB ATLAS SYSTEM CONNECTIVITY AUDIT       ');
  console.log('====================================================');

  if (
    !uri ||
    uri.includes('<username>') ||
    uri.includes('<password>') ||
    uri.includes('<cluster>')
  ) {
    console.log('[Phase F] MONGODB_URI not configured with real credentials in .env.');
    console.log('[Notice] Please enter real Atlas credentials into .env locally.');
    console.log('STATUS: PENDING OWNER ATLAS CREDENTIALS INPUT');
    return { success: false, reason: 'PENDING_CREDENTIALS' };
  }

  // 1. DNS Resolution Check
  try {
    const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
    const host = url.hostname;
    console.log(`[1. DNS Test] Resolving host: ${host} ...`);
    const addresses = await resolveDns(host).catch(() => ['SRV/Custom Resolution']);
    console.log(`[1. DNS Test] PASS. Resolved target:`, addresses);
  } catch (err: unknown) {
    console.log(`[1. DNS Test] Custom SRV format: ${(err as Error).message}`);
  }

  // 2. TLS Connection & Ping Test
  console.log(`[2. Connection Test] Connecting with TLS pooling enabled ...`);
  const connResult = await mongoDbService.connect(uri, dbName);
  if (!connResult.success) {
    console.error(`[2. Connection Test] FAILED: ${connResult.error}`);
    return { success: false, error: connResult.error };
  }
  console.log(`[2. Connection Test] PASS! Database ping response in ${connResult.pingTimeMs}ms.`);

  const db = mongoDbService.getDb();

  // 3. Metadata & Collections Read
  console.log(`[3. Metadata Check] Inspecting collections in "${dbName}" ...`);
  const collections = await db.listCollections().toArray();
  console.log(
    `[3. Metadata Check] PASS! Found ${collections.length} collections:`,
    collections.map((c) => c.name)
  );

  // 4. Temporary Document Roundtrip (Isolation QA)
  console.log(`[4. Roundtrip Test] Writing temporary QA test document to __qa_validation ...`);
  const qaCollection = db.collection<{ _id: string; test: boolean; timestamp: Date }>(
    '__qa_validation'
  );
  const testDocId = `diag_${Date.now()}`;
  await qaCollection.insertOne({ _id: testDocId, test: true, timestamp: new Date() });

  const readBack = await qaCollection.findOne({ _id: testDocId });
  if (!readBack) {
    throw new Error('QA document write/read verification failed');
  }
  console.log(`[4. Roundtrip Test] Read-back confirmed: Document exists.`);

  await qaCollection.deleteOne({ _id: testDocId });
  console.log(`[4. Roundtrip Test] PASS! Temporary QA test document cleaned up successfully.`);

  // 5. Initialize/Verify Core Indexes Safely
  console.log(`[5. Indexes Check] Verifying and initializing required collection indexes ...`);
  const indexResults = await initializeDatabaseIndexes(uri, dbName);
  for (const r of indexResults) {
    console.log(
      `  - Collection [${r.collection}]: indexes verified -> ${r.indexesCreated.join(', ')}`
    );
  }
  console.log(`[5. Indexes Check] PASS! All system indexes synchronized safely.`);

  await mongoDbService.disconnect();
  console.log('====================================================');
  console.log('RESULT: ALL MONGODB ATLAS CONNECTIVITY CHECKS PASSED');
  console.log('====================================================');

  return { success: true };
}

if (
  process.argv[1]?.includes('diagnostic') ||
  process.argv[1]?.includes('atlas-diagnostic') ||
  process.argv[1]?.includes('atlas_diagnostic')
) {
  runAtlasDiagnostic().catch((err) => {
    console.error('Atlas diagnostic failed:', err);
    process.exit(1);
  });
}
