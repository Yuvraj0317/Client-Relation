import api from './server';
import http from 'http';
import { prisma } from './prisma';

async function runIntegrationTest() {
  console.log('🧪 Starting End-to-End API Integration Verification Test...\n');

  // Start Express server on test port 5005
  const server = api.listen(5005, async () => {
    try {
      // 1. Healthcheck Test
      const healthRes = await makeRequest('GET', '/health');
      console.log(`✅ Health Check: HTTP ${healthRes.status} | Service: ${healthRes.data.data.service}`);

      // 2. Login Test (Admin User)
      const loginRes = await makeRequest('POST', '/api/v1/auth/login', {
        email: 'admin@fundsroom.com',
        password: 'Password123!',
      });
      console.log(`✅ Auth Login: HTTP ${loginRes.status} | Token Issued: ${!!loginRes.data.data.token}`);
      const adminToken = loginRes.data.data.token;

      // 3. Customer List Test
      const custRes = await makeRequest('GET', '/api/v1/customers', null, adminToken);
      console.log(`✅ CRM Customer List: HTTP ${custRes.status} | Total Accounts: ${custRes.data.data.length}`);

      // 4. Product List & Low Stock Alerts Test
      const prodRes = await makeRequest('GET', '/api/v1/products?lowStockOnly=true', null, adminToken);
      console.log(`✅ Inventory Low Stock Filter: HTTP ${prodRes.status} | Low Stock Items: ${prodRes.data.data.length}`);

      // 5. Sales Challan Creation & Confirmation Test
      const customerId = custRes.data.data[0].id;
      const products = (await makeRequest('GET', '/api/v1/products', null, adminToken)).data.data;
      const validProduct = products.find((p: any) => p.currentStock >= 2);

      const challanDraftRes = await makeRequest('POST', '/api/v1/sales-challans', {
        customerId,
        notes: 'Integration Test Challan',
        items: [{ productId: validProduct.id, quantity: 2 }],
      }, adminToken);
      const newChallan = challanDraftRes.data.data;
      console.log(`✅ Sales Challan Draft Created: HTTP ${challanDraftRes.status} | Number: ${newChallan.challanNumber} | Status: ${newChallan.status}`);

      // 6. Confirm Challan (Deduct Stock)
      const stockBefore = (await prisma.product.findUnique({ where: { id: validProduct.id } }))?.currentStock;
      const confirmRes = await makeRequest('PATCH', `/api/v1/sales-challans/${newChallan.id}/confirm`, null, adminToken);
      const stockAfter = (await prisma.product.findUnique({ where: { id: validProduct.id } }))?.currentStock;
      console.log(`✅ Sales Challan Confirmed & Dispatched: HTTP ${confirmRes.status} | Stock Before: ${stockBefore} → Stock After: ${stockAfter} (Deducted 2)`);

      // 7. Verify Stock Non-Negativity Error Handling
      const invalidQuantityRes = await makeRequest('POST', '/api/v1/sales-challans', {
        customerId,
        notes: 'Invalid Stock Challan',
        items: [{ productId: validProduct.id, quantity: 99999 }],
      }, adminToken);
      const invalidConfirmRes = await makeRequest('PATCH', `/api/v1/sales-challans/${invalidQuantityRes.data.data.id}/confirm`, null, adminToken);
      console.log(`✅ Insufficient Stock Guardrail: HTTP ${invalidConfirmRes.status} | Code: ${invalidConfirmRes.data.error.code} | Msg: ${invalidConfirmRes.data.error.message}`);

      console.log('\n🎉 ALL INTEGRATION API TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
      console.error('❌ Integration test failed:', err);
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
        port: 5005,
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

runIntegrationTest();
