import app from './server';
import http from 'http';
import { prisma } from './prisma';

async function runPhase6ChallanVerification() {
  console.log('🧪 Starting Critical Phase 6 Sales Delivery Challan Backend Verification Suite...\n');

  const server = app.listen(5012, async () => {
    try {
      let passedCount = 0;
      let totalCount = 0;

      const assertTest = (name: string, condition: boolean, details: string) => {
        totalCount++;
        if (condition) {
          passedCount++;
          console.log(`✅ [TEST ${totalCount}] PASS: ${name} (${details})`);
        } else {
          console.error(`❌ [TEST ${totalCount}] FAIL: ${name} (${details})`);
        }
      };

      // Authenticate Sales, Admin, and Accounts Users
      const salesAuthRes = await makeRequest('POST', '/api/auth/login', {
        email: 'sales@fundsroom.com',
        password: 'Password123!',
      });
      const salesToken = salesAuthRes.data.token || salesAuthRes.data.data?.token;

      const adminAuthRes = await makeRequest('POST', '/api/auth/login', {
        email: 'admin@fundsroom.com',
        password: 'Password123!',
      });
      const adminToken = adminAuthRes.data.token || adminAuthRes.data.data?.token;

      const accountsAuthRes = await makeRequest('POST', '/api/auth/login', {
        email: 'accounts@fundsroom.com',
        password: 'Password123!',
      });
      const accountsToken = accountsAuthRes.data.token || accountsAuthRes.data.data?.token;

      // Seed test customer
      const customer = await prisma.customer.findFirst();
      if (!customer) throw new Error('No test customer found in database');

      // Seed test products
      const prodA = await prisma.product.create({
        data: {
          name: 'High Pressure Hose 25mm',
          sku: `SKU_HOSE_${Date.now()}`,
          category: 'Hydraulics',
          unitPrice: 1200.0,
          currentStock: 20,
          minStock: 5,
          location: 'Bay H1',
          createdById: (salesAuthRes.data.user || salesAuthRes.data.data?.user).id,
        },
      });

      const prodB = await prisma.product.create({
        data: {
          name: 'Steel Coupling 50mm',
          sku: `SKU_COUPLING_${Date.now()}`,
          category: 'Hydraulics',
          unitPrice: 350.0,
          currentStock: 5, // Limited stock of 5
          minStock: 2,
          location: 'Bay C2',
          createdById: (salesAuthRes.data.user || salesAuthRes.data.data?.user).id,
        },
      });

      // TEST A: Draft creation
      const draftRes = await makeRequest(
        'POST',
        '/api/challans',
        {
          customerId: customer.id,
          notes: 'Standard batch dispatch for industrial customer',
          items: [
            { productId: prodA.id, quantity: 5, unitPrice: 1200.0 },
          ],
        },
        salesToken
      );
      const draftChallan = draftRes.data.data || draftRes.data;
      assertTest(
        'Test A: Draft Creation',
        draftRes.status === 201 && draftChallan.status === 'DRAFT' && !!draftChallan.challanNumber,
        `HTTP ${draftRes.status}, Challan #: ${draftChallan?.challanNumber}`
      );

      // TEST B: Draft does not change stock
      const stockProdA_Before = await prisma.product.findUnique({ where: { id: prodA.id } });
      assertTest(
        'Test B: Draft Creation Zero Stock Deduction Check',
        stockProdA_Before?.currentStock === 20,
        `Current Stock: ${stockProdA_Before?.currentStock} (Expected: 20)`
      );

      // TEST C: Confirm with enough stock
      const confirmRes = await makeRequest(
        'POST',
        `/api/challans/${draftChallan.id}/confirm`,
        null,
        adminToken
      );
      const confirmedChallan = confirmRes.data.data || confirmRes.data;
      assertTest(
        'Test C: Confirm with Enough Stock',
        confirmRes.status === 200 && confirmedChallan.status === 'CONFIRMED',
        `HTTP ${confirmRes.status}, Status: ${confirmedChallan?.status}`
      );

      // TEST D: Confirm reduces stock
      const stockProdA_AfterConfirm = await prisma.product.findUnique({ where: { id: prodA.id } });
      assertTest(
        'Test D: Confirm Reduces Stock Balance',
        stockProdA_AfterConfirm?.currentStock === 15,
        `Current Stock: ${stockProdA_AfterConfirm?.currentStock} (Expected 20 - 5 = 15)`
      );

      // TEST E: Confirm creates OUT stock movement
      const movementsProdA = await prisma.stockMovement.findMany({
        where: { productId: prodA.id, type: 'OUT' },
      });
      assertTest(
        'Test E: Confirm Creates OUT Stock Movement Entry',
        movementsProdA.length > 0 && movementsProdA[0].quantity === 5,
        `OUT Movements Count: ${movementsProdA.length}, Qty: ${movementsProdA[0]?.quantity}`
      );

      // TEST F: Confirm with insufficient stock
      const excessDraftRes = await makeRequest(
        'POST',
        '/api/challans',
        {
          customerId: customer.id,
          items: [{ productId: prodA.id, quantity: 999 }],
        },
        salesToken
      );
      const excessChallan = excessDraftRes.data.data || excessDraftRes.data;
      const confirmExcessRes = await makeRequest(
        'POST',
        `/api/challans/${excessChallan.id}/confirm`,
        null,
        adminToken
      );
      assertTest(
        'Test F: Confirm with Insufficient Stock (Rejection)',
        confirmExcessRes.status === 400,
        `HTTP ${confirmExcessRes.status}, Error Code: ${confirmExcessRes.data.error?.code}`
      );

      // TEST G: Verify stock never becomes negative
      const stockProdA_CheckNeg = await prisma.product.findUnique({ where: { id: prodA.id } });
      assertTest(
        'Test G: Verify Stock Never Becomes Negative',
        stockProdA_CheckNeg!.currentStock >= 0,
        `Current Stock: ${stockProdA_CheckNeg?.currentStock} (Must be >= 0)`
      );

      // TEST H: Multiple-product challan creation
      const multiDraftRes = await makeRequest(
        'POST',
        '/api/challans',
        {
          customerId: customer.id,
          items: [
            { productId: prodA.id, quantity: 2 },
            { productId: prodB.id, quantity: 3 },
          ],
        },
        salesToken
      );
      const multiChallan = multiDraftRes.data.data || multiDraftRes.data;
      assertTest(
        'Test H: Multiple-Product Challan Creation',
        multiDraftRes.status === 201 && multiChallan.items?.length === 2,
        `HTTP ${multiDraftRes.status}, Items Count: ${multiChallan.items?.length}`
      );

      // TEST I & J: One product insufficient in a multi-product challan -> Verify transaction rollback!
      // prodA has stock 15 (req 2), prodB has stock 5 (req 50 -> shortfall!)
      const failedMultiRes = await makeRequest(
        'POST',
        '/api/challans',
        {
          customerId: customer.id,
          items: [
            { productId: prodA.id, quantity: 2 },  // Valid (stock 15)
            { productId: prodB.id, quantity: 50 }, // Insufficient (stock 5)
          ],
        },
        salesToken
      );
      const failedMultiChallan = failedMultiRes.data.data || failedMultiRes.data;
      const rollbackConfirmRes = await makeRequest(
        'POST',
        `/api/challans/${failedMultiChallan.id}/confirm`,
        null,
        adminToken
      );

      const stockProdA_RollbackCheck = await prisma.product.findUnique({ where: { id: prodA.id } });
      assertTest(
        'Test I & J: Multi-Product Insufficient Stock & Full Transaction Rollback',
        rollbackConfirmRes.status === 400 && stockProdA_RollbackCheck?.currentStock === 15,
        `HTTP ${rollbackConfirmRes.status}, ProdA Stock Untouched: ${stockProdA_RollbackCheck?.currentStock} (Expected 15)`
      );

      // TEST K: Confirm already confirmed challan
      const reConfirmRes = await makeRequest(
        'POST',
        `/api/challans/${draftChallan.id}/confirm`,
        null,
        adminToken
      );
      assertTest(
        'Test K: Re-confirm Already Confirmed Challan (Duplicate Prevention)',
        reConfirmRes.status === 400,
        `HTTP ${reConfirmRes.status}, Error Code: ${reConfirmRes.data.error?.code}`
      );

      // TEST L: Cancel draft (cancels without altering stock)
      const cancelDraftRes = await makeRequest(
        'POST',
        `/api/challans/${excessChallan.id}/cancel`,
        null,
        adminToken
      );
      assertTest(
        'Test L: Cancel Draft Challan',
        cancelDraftRes.status === 200 && cancelDraftRes.data.data?.status === 'CANCELLED',
        `HTTP ${cancelDraftRes.status}, Status: ${cancelDraftRes.data.data?.status}`
      );

      // TEST M: Cancel confirmed challan (restores deducted stock & creates IN movement logs)
      const cancelConfirmedRes = await makeRequest(
        'POST',
        `/api/challans/${draftChallan.id}/cancel`,
        null,
        accountsToken
      );
      const stockProdA_AfterCancel = await prisma.product.findUnique({ where: { id: prodA.id } });
      assertTest(
        'Test M: Cancel Confirmed Challan & Verify Stock Restoration',
        cancelConfirmedRes.status === 200 && stockProdA_AfterCancel?.currentStock === 20,
        `HTTP ${cancelConfirmedRes.status}, Restored Stock: ${stockProdA_AfterCancel?.currentStock} (Expected 15 + 5 = 20)`
      );

      // TEST N: Verify product snapshot remains unchanged after product price/name changes in catalog
      // Update prodA name and unitPrice in master catalog
      await prisma.product.update({
        where: { id: prodA.id },
        data: { name: 'MUTATED PRODUCT NAME', unitPrice: 9999.00 },
      });

      const fetchedHistoricalChallan = await makeRequest(
        'GET',
        `/api/challans/${draftChallan.id}`,
        null,
        salesToken
      );
      const historicalItem = (fetchedHistoricalChallan.data.data || fetchedHistoricalChallan.data).items[0];
      assertTest(
        'Test N: Historical Product Snapshot Integrity',
        historicalItem.productName === 'High Pressure Hose 25mm' && parseFloat(historicalItem.unitPrice) === 1200,
        `Snapshot Name: "${historicalItem.productName}", Snapshot Price: ₹${historicalItem.unitPrice}`
      );

      console.log(`\n🎉 PHASE 6 ALL 14 CRITICAL TESTS COMPLETE: ${passedCount}/${totalCount} TESTS PASSED!`);
    } catch (err) {
      console.error('❌ Phase 6 Challan verification error:', err);
    } finally {
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    }
  });
}

function makeRequest(method: string, path: string, body?: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5012,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(body && { 'Content-Length': Buffer.byteLength(dataString) }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
          } catch (e) {
            resolve({ status: res.statusCode, data: responseBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(dataString);
    req.end();
  });
}

runPhase6ChallanVerification();
