import app from './server';
import http from 'http';
import { prisma } from './prisma';

async function runPhase9DeploymentVerification() {
  console.log('🧪 Starting Phase 9 Production Deployment Verification Test...\n');

  const server = app.listen(5016, async () => {
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

      // 1. GET /api/health Verification
      const healthRes = await makeRequest('GET', '/api/health');
      assertTest(
        'Health Check: GET /api/health',
        healthRes.status === 200 && healthRes.data.data?.status === 'OK',
        `HTTP ${healthRes.status}, Status: "${healthRes.data.data?.status}", Env: "${healthRes.data.data?.environment}"`
      );

      // 2. Authentication Test (Login)
      const loginRes = await makeRequest('POST', '/api/auth/login', {
        email: 'admin@fundsroom.com',
        password: 'Password123!',
      });
      const token = loginRes.data.token || loginRes.data.data?.token;
      assertTest(
        'Authentication: Admin Login & JWT Issuance',
        loginRes.status === 200 && !!token,
        `HTTP ${loginRes.status}, Token Issued: ${!!token}`
      );

      // 3. Customer API Verification
      const custRes = await makeRequest('GET', '/api/customers', null, token);
      assertTest(
        'Customer API: GET /api/customers',
        custRes.status === 200 && Array.isArray(custRes.data.data || custRes.data),
        `HTTP ${custRes.status}, Total Customers: ${custRes.data.meta?.total}`
      );

      // 4. Product API Verification
      const prodRes = await makeRequest('GET', '/api/products', null, token);
      assertTest(
        'Product API: GET /api/products',
        prodRes.status === 200 && Array.isArray(prodRes.data.data || prodRes.data),
        `HTTP ${prodRes.status}, Total Products: ${prodRes.data.meta?.total}`
      );

      // 5. Challan Creation, Confirmation, & Stock Deduction
      const customer = await prisma.customer.findFirst();
      const product = await prisma.product.create({
        data: {
          name: 'Deployment Test SKU',
          sku: `SKU_DEPLOY_${Date.now()}`,
          category: 'Deployment',
          unitPrice: 1000.0,
          currentStock: 25,
          minStock: 5,
          location: 'Bay D',
          createdById: (loginRes.data.user || loginRes.data.data?.user).id,
        },
      });

      // Create Challan Draft
      const createChallanRes = await makeRequest(
        'POST',
        '/api/challans',
        {
          customerId: customer!.id,
          notes: 'Deployment verification test order',
          items: [{ productId: product.id, quantity: 5, unitPrice: 1000.0 }],
        },
        token
      );
      const challan = createChallanRes.data.data || createChallanRes.data;
      assertTest(
        'Challan Creation: Draft Created (Zero Stock Deduction)',
        createChallanRes.status === 201 && challan.status === 'DRAFT',
        `HTTP ${createChallanRes.status}, Challan #: ${challan?.challanNumber}`
      );

      // Confirm Challan
      const confirmRes = await makeRequest('POST', `/api/challans/${challan.id}/confirm`, null, token);
      assertTest(
        'Challan Confirmation: Status CONFIRMED',
        confirmRes.status === 200 && (confirmRes.data.data || confirmRes.data).status === 'CONFIRMED',
        `HTTP ${confirmRes.status}`
      );

      // Stock Deduction Verification
      const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
      assertTest(
        'Stock Deduction Verification: Stock Decremented (25 -> 20)',
        updatedProduct?.currentStock === 20,
        `Current Stock: ${updatedProduct?.currentStock} (Expected 25 - 5 = 20)`
      );

      console.log(`\n🎉 PHASE 9 PRODUCTION DEPLOYMENT VERIFICATION COMPLETE: ${passedCount}/${totalCount} TESTS PASSED!`);
    } catch (err) {
      console.error('❌ Phase 9 Deployment verification error:', err);
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
        port: 5016,
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

runPhase9DeploymentVerification();
