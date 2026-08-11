import app from './server';
import http from 'http';
import { prisma } from './prisma';

async function runPhase8FullIntegrationSuite() {
  console.log('🧪 Starting Phase 8 Full Integration & Role Boundary Test Suite...\n');

  const server = app.listen(5015, async () => {
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

      // 1. Authenticate All 4 Roles
      const adminAuth = await loginUser('admin@fundsroom.com', 'Password123!');
      const salesAuth = await loginUser('sales@fundsroom.com', 'Password123!');
      const warehouseAuth = await loginUser('warehouse@fundsroom.com', 'Password123!');
      const accountsAuth = await loginUser('accounts@fundsroom.com', 'Password123!');

      assertTest(
        'Authentication: Admin Role Login',
        adminAuth.status === 200 && adminAuth.user.role === 'ADMIN',
        `User: ${adminAuth.user.name}, Role: ${adminAuth.user.role}`
      );
      assertTest(
        'Authentication: Sales Role Login',
        salesAuth.status === 200 && salesAuth.user.role === 'SALES',
        `User: ${salesAuth.user.name}, Role: ${salesAuth.user.role}`
      );
      assertTest(
        'Authentication: Warehouse Role Login',
        warehouseAuth.status === 200 && warehouseAuth.user.role === 'WAREHOUSE',
        `User: ${warehouseAuth.user.name}, Role: ${warehouseAuth.user.role}`
      );
      assertTest(
        'Authentication: Accounts Role Login',
        accountsAuth.status === 200 && accountsAuth.user.role === 'ACCOUNTS',
        `User: ${accountsAuth.user.name}, Role: ${accountsAuth.user.role}`
      );

      // 2. Complete User Journey Test
      // Step A: Dashboard operational query
      const dashCustRes = await makeRequest('GET', '/api/customers', null, salesAuth.token);
      const dashProdRes = await makeRequest('GET', '/api/products', null, salesAuth.token);
      const dashLowStockRes = await makeRequest('GET', '/api/products/low-stock', null, salesAuth.token);
      const dashChallanRes = await makeRequest('GET', '/api/challans', null, salesAuth.token);
      assertTest(
        'User Journey: Dashboard Metrics Fetch',
        dashCustRes.status === 200 && dashProdRes.status === 200 && dashLowStockRes.status === 200 && dashChallanRes.status === 200,
        `Custs: ${dashCustRes.data.meta?.total}, Prods: ${dashProdRes.data.meta?.total}, LowStock: ${dashLowStockRes.data.data?.length}`
      );

      // Step B: Customer Creation
      const custEmail = `journey_${Date.now()}@example.com`;
      const createCustRes = await makeRequest(
        'POST',
        '/api/customers',
        {
          name: 'Journey Industrial Buyers Ltd',
          mobile: '+91 9123456789',
          email: custEmail,
          businessName: 'Journey Industrial',
          gstNumber: '27AAAAA1234A1Z1',
          customerType: 'WHOLESALE',
          address: 'Phase 8 Industrial Zone, Pune',
          status: 'ACTIVE',
        },
        salesAuth.token
      );
      const journeyCust = createCustRes.data.data || createCustRes.data;
      assertTest(
        'User Journey: Customer Creation',
        createCustRes.status === 201 && !!journeyCust.id,
        `HTTP ${createCustRes.status}, ID: ${journeyCust?.id}`
      );

      // Step C: Product SKU Creation
      const skuCode = `SKU_JOURNEY_${Date.now()}`;
      const createProdRes = await makeRequest(
        'POST',
        '/api/products',
        {
          name: 'Journey Hydraulic Cylinder 100mm',
          sku: skuCode,
          category: 'Hydraulics',
          unitPrice: 4500.0,
          currentStock: 15,
          minimumStock: 5,
          warehouse: 'Pune Warehouse Bay 1',
        },
        warehouseAuth.token
      );
      const journeyProd = createProdRes.data.data || createProdRes.data;
      assertTest(
        'User Journey: Product SKU Creation',
        createProdRes.status === 201 && journeyProd.sku === skuCode,
        `HTTP ${createProdRes.status}, Initial Stock: ${journeyProd?.currentStock}`
      );

      // Step D: Create Sales Challan Draft
      const draftRes = await makeRequest(
        'POST',
        '/api/challans',
        {
          customerId: journeyCust.id,
          notes: 'User journey E2E test dispatch',
          items: [
            { productId: journeyProd.id, quantity: 5, unitPrice: 4500.0 },
          ],
        },
        salesAuth.token
      );
      const journeyChallan = draftRes.data.data || draftRes.data;
      assertTest(
        'User Journey: Create Challan Draft',
        draftRes.status === 201 && journeyChallan.status === 'DRAFT',
        `HTTP ${draftRes.status}, Challan #: ${journeyChallan?.challanNumber}`
      );

      // Step E: Save Draft & Verify Stock Unchanged
      const stockCheck1 = await prisma.product.findUnique({ where: { id: journeyProd.id } });
      assertTest(
        'User Journey: Draft Does Not Deduct Stock',
        stockCheck1?.currentStock === 15,
        `Current Stock: ${stockCheck1?.currentStock} (Expected: 15)`
      );

      // Step F: Confirm Challan
      const confirmRes = await makeRequest(
        'POST',
        `/api/challans/${journeyChallan.id}/confirm`,
        null,
        adminAuth.token
      );
      const confirmedChallan = confirmRes.data.data || confirmRes.data;
      assertTest(
        'User Journey: Confirm Challan Dispatch',
        confirmRes.status === 200 && confirmedChallan.status === 'CONFIRMED',
        `HTTP ${confirmRes.status}, Status: ${confirmedChallan?.status}`
      );

      // Step G: Verify Stock Decreased
      const stockCheck2 = await prisma.product.findUnique({ where: { id: journeyProd.id } });
      assertTest(
        'User Journey: Stock Decreased Post-Confirmation',
        stockCheck2?.currentStock === 10,
        `Current Stock: ${stockCheck2?.currentStock} (Expected 15 - 5 = 10)`
      );

      // Step H: Verify Stock Movement Created
      const movements = await prisma.stockMovement.findMany({
        where: { productId: journeyProd.id, type: 'OUT' },
      });
      assertTest(
        'User Journey: OUT Stock Movement Log Created',
        movements.length > 0 && movements[0].quantity === 5,
        `Movement Count: ${movements.length}, Quantity Deducted: ${movements[0]?.quantity}`
      );

      // Step I: View Challan & Verify Snapshot
      const getChallanRes = await makeRequest('GET', `/api/challans/${journeyChallan.id}`, null, salesAuth.token);
      const viewedChallan = getChallanRes.data.data || getChallanRes.data;
      const snapshotItem = viewedChallan.items[0];
      assertTest(
        'User Journey: View Challan & Snapshot Verification',
        getChallanRes.status === 200 && snapshotItem.productName === 'Journey Hydraulic Cylinder 100mm' && parseFloat(snapshotItem.unitPrice) === 4500,
        `Snapshot Name: "${snapshotItem?.productName}", Snapshot Price: ₹${snapshotItem?.unitPrice}`
      );

      // 3. Error Scenarios & Input Validation Boundary Tests
      // Scenario 1: Invalid Email Format
      const invalidEmailRes = await makeRequest(
        'POST',
        '/api/customers',
        { name: 'Bad Email Ltd', mobile: '9988776655', email: 'invalid-email-string', address: 'Pune' },
        salesAuth.token
      );
      assertTest('Validation: Invalid Email Rejection (422)', invalidEmailRes.status === 422, `HTTP ${invalidEmailRes.status}`);

      // Scenario 2: Duplicate SKU Rejection
      const dupSkuRes = await makeRequest(
        'POST',
        '/api/products',
        { name: 'Dup SKU', sku: skuCode, category: 'Test', unitPrice: 100 },
        warehouseAuth.token
      );
      assertTest('Validation: Duplicate SKU Rejection (409)', dupSkuRes.status === 409, `HTTP ${dupSkuRes.status}`);

      // Scenario 3: Nonexistent Customer in Challan Creation
      const nonCustRes = await makeRequest(
        'POST',
        '/api/challans',
        { customerId: '00000000-0000-0000-0000-000000000000', items: [{ productId: journeyProd.id, quantity: 1 }] },
        salesAuth.token
      );
      assertTest('Validation: Nonexistent Customer Rejection (404)', nonCustRes.status === 404, `HTTP ${nonCustRes.status}`);

      // Scenario 4: Nonexistent Product in Challan Creation
      const nonProdRes = await makeRequest(
        'POST',
        '/api/challans',
        { customerId: journeyCust.id, items: [{ productId: '00000000-0000-0000-0000-000000000000', quantity: 1 }] },
        salesAuth.token
      );
      assertTest('Validation: Nonexistent Product Rejection (404)', nonProdRes.status === 404, `HTTP ${nonProdRes.status}`);

      // Scenario 5: Zero Quantity Rejection
      const zeroQtyRes = await makeRequest(
        'POST',
        '/api/challans',
        { customerId: journeyCust.id, items: [{ productId: journeyProd.id, quantity: 0 }] },
        salesAuth.token
      );
      assertTest('Validation: Zero Quantity Rejection (422/400)', zeroQtyRes.status === 422 || zeroQtyRes.status === 400, `HTTP ${zeroQtyRes.status}`);

      // Scenario 6: Negative Quantity Rejection
      const negQtyRes = await makeRequest(
        'POST',
        '/api/challans',
        { customerId: journeyCust.id, items: [{ productId: journeyProd.id, quantity: -5 }] },
        salesAuth.token
      );
      assertTest('Validation: Negative Quantity Rejection (422/400)', negQtyRes.status === 422 || negQtyRes.status === 400, `HTTP ${negQtyRes.status}`);

      // Scenario 7: Insufficient Stock Rejection
      const excessChallanRes = await makeRequest(
        'POST',
        '/api/challans',
        { customerId: journeyCust.id, items: [{ productId: journeyProd.id, quantity: 999 }] },
        salesAuth.token
      );
      const excessChallan = excessChallanRes.data.data || excessChallanRes.data;
      const confirmExcessRes = await makeRequest('POST', `/api/challans/${excessChallan.id}/confirm`, null, adminAuth.token);
      assertTest('Validation: Insufficient Stock Confirmation Rejection (400)', confirmExcessRes.status === 400, `HTTP ${confirmExcessRes.status}`);

      // Scenario 8: Duplicate Challan Confirmation
      const dupConfirmRes = await makeRequest('POST', `/api/challans/${journeyChallan.id}/confirm`, null, adminAuth.token);
      assertTest('Validation: Duplicate Challan Confirmation Rejection (400)', dupConfirmRes.status === 400, `HTTP ${dupConfirmRes.status}`);

      // Scenario 9: Confirm Cancelled Challan
      await makeRequest('POST', `/api/challans/${excessChallan.id}/cancel`, null, adminAuth.token);
      const confirmCancelledRes = await makeRequest('POST', `/api/challans/${excessChallan.id}/confirm`, null, adminAuth.token);
      assertTest('Validation: Confirm Cancelled Challan Rejection (400)', confirmCancelledRes.status === 400, `HTTP ${confirmCancelledRes.status}`);

      // Scenario 10: Invalid/Expired JWT Token
      const invalidJwtRes = await makeRequest('GET', '/api/auth/me', null, 'invalid.jwt.signature');
      assertTest('Security: Invalid JWT Rejection (401)', invalidJwtRes.status === 401, `HTTP ${invalidJwtRes.status}`);

      // Scenario 11: Unauthorized Role Access (Warehouse user attempting Customer deletion)
      const unauthRoleRes = await makeRequest('DELETE', `/api/customers/${journeyCust.id}`, null, warehouseAuth.token);
      assertTest('Security: Unauthorized Role Rejection (403)', unauthRoleRes.status === 403, `HTTP ${unauthRoleRes.status}`);

      console.log(`\n🎉 PHASE 8 FULL INTEGRATION VERIFICATION COMPLETE: ${passedCount}/${totalCount} TESTS PASSED!`);
    } catch (err) {
      console.error('❌ Phase 8 Integration verification error:', err);
    } finally {
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    }
  });
}

async function loginUser(email: string, pass: string): Promise<any> {
  const res = await makeRequest('POST', '/api/auth/login', { email, password: pass });
  const token = res.data.token || res.data.data?.token;
  const user = res.data.user || res.data.data?.user;
  return { status: res.status, token, user };
}

function makeRequest(method: string, path: string, body?: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5015,
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

runPhase8FullIntegrationSuite();
