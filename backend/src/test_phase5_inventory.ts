import app from './server';
import http from 'http';
import { prisma } from './prisma';

async function runPhase5InventoryVerification() {
  console.log('🧪 Starting Phase 5 Product & Inventory Backend Verification Suite...\n');

  const server = app.listen(5010, async () => {
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

      // 1. Authenticate Warehouse and Admin Users
      const warehouseAuthRes = await makeRequest('POST', '/api/auth/login', {
        email: 'warehouse@fundsroom.com',
        password: 'Password123!',
      });
      const warehouseToken = warehouseAuthRes.data.token || warehouseAuthRes.data.data?.token;

      const adminAuthRes = await makeRequest('POST', '/api/auth/login', {
        email: 'admin@fundsroom.com',
        password: 'Password123!',
      });
      const adminToken = adminAuthRes.data.token || adminAuthRes.data.data?.token;

      // 2. Product Creation (POST /api/products)
      const skuCode = `SKU_PROD_${Date.now()}`;
      const createProdRes = await makeRequest(
        'POST',
        '/api/products',
        {
          name: 'Precision Pressure Sensor 100PSI',
          sku: skuCode,
          category: 'Sensors',
          unitPrice: 2850.0,
          currentStock: 2, // Low stock (minStock = 10)
          minimumStock: 10,
          warehouse: 'East Warehouse Bay 4',
        },
        warehouseToken
      );

      const createdProd = createProdRes.data.data || createProdRes.data;
      assertTest(
        'POST /api/products (Product Creation)',
        createProdRes.status === 201 && createdProd.sku === skuCode,
        `HTTP ${createProdRes.status}, ID: ${createdProd?.id}, SKU: ${createdProd?.sku}`
      );

      // 3. Duplicate SKU Rejection (409 Conflict)
      const duplicateSkuRes = await makeRequest(
        'POST',
        '/api/products',
        {
          name: 'Duplicate Sensor',
          sku: skuCode,
          category: 'Sensors',
          unitPrice: 2850.0,
        },
        warehouseToken
      );
      assertTest(
        'Duplicate SKU Rejection (409 Conflict)',
        duplicateSkuRes.status === 409,
        `HTTP ${duplicateSkuRes.status}, Code: ${duplicateSkuRes.data.error?.code}`
      );

      // 4. Invalid Price Rejection (400 Bad Request)
      const invalidPriceRes = await makeRequest(
        'POST',
        '/api/products',
        {
          name: 'Negative Price Sensor',
          sku: `SKU_NEG_PRICE_${Date.now()}`,
          category: 'Sensors',
          unitPrice: -50.0, // Invalid negative price
        },
        warehouseToken
      );
      assertTest(
        'Invalid Price Rejection (400 Bad Request)',
        invalidPriceRes.status === 400 || invalidPriceRes.status === 422,
        `HTTP ${invalidPriceRes.status}, Code: ${invalidPriceRes.data.error?.code}`
      );

      // 5. Invalid Stock Rejection (400 Bad Request)
      const invalidStockRes = await makeRequest(
        'POST',
        '/api/products',
        {
          name: 'Negative Stock Sensor',
          sku: `SKU_NEG_STOCK_${Date.now()}`,
          category: 'Sensors',
          unitPrice: 100.0,
          currentStock: -10, // Invalid negative stock
        },
        warehouseToken
      );
      assertTest(
        'Invalid Stock Rejection (400 Bad Request)',
        invalidStockRes.status === 400 || invalidStockRes.status === 422,
        `HTTP ${invalidStockRes.status}, Code: ${invalidStockRes.data.error?.code}`
      );

      // 6. Product Lookup (GET /api/products/:id)
      const getByIdRes = await makeRequest(
        'GET',
        `/api/products/${createdProd.id}`,
        null,
        warehouseToken
      );
      const fetchedProd = getByIdRes.data.data || getByIdRes.data;
      assertTest(
        'GET /api/products/:id (Product Lookup)',
        getByIdRes.status === 200 && fetchedProd.id === createdProd.id,
        `HTTP ${getByIdRes.status}, Name: "${fetchedProd.name}"`
      );

      // 7. Product Update (PUT /api/products/:id)
      const updateRes = await makeRequest(
        'PUT',
        `/api/products/${createdProd.id}`,
        {
          unitPrice: 2950.0,
          minimumStock: 15,
        },
        warehouseToken
      );
      const updatedProd = updateRes.data.data || updateRes.data;
      assertTest(
        'PUT /api/products/:id (Product Update)',
        updateRes.status === 200 && parseFloat(updatedProd.unitPrice) === 2950,
        `HTTP ${updateRes.status}, New Price: ₹${updatedProd.unitPrice}`
      );

      // Log a stock movement for movement lookup test
      await makeRequest(
        'POST',
        `/api/products/${createdProd.id}/stock-movement`,
        {
          type: 'IN',
          quantity: 20,
          reason: 'Quarterly warehouse restock',
        },
        warehouseToken
      );

      // 8. Stock Movement Lookup (GET /api/stock/movements)
      const movementsRes = await makeRequest('GET', '/api/stock/movements', null, warehouseToken);
      const movementsList = movementsRes.data.data || movementsRes.data;
      assertTest(
        'GET /api/stock/movements (Stock Movement Lookup)',
        movementsRes.status === 200 && Array.isArray(movementsList) && movementsList.length > 0,
        `HTTP ${movementsRes.status}, Movement Records Found: ${movementsList.length}`
      );

      // 9. Product Deletion (DELETE /api/products/:id)
      const deleteRes = await makeRequest(
        'DELETE',
        `/api/products/${createdProd.id}`,
        null,
        adminToken
      );
      assertTest(
        'DELETE /api/products/:id (Admin Authorized Delete)',
        deleteRes.status === 200,
        `HTTP ${deleteRes.status}, Msg: "${deleteRes.data.data?.message || deleteRes.data.message}"`
      );

      console.log(`\n🎉 PHASE 5 FULL VERIFICATION COMPLETE: ${passedCount}/${totalCount} TESTS PASSED!`);
    } catch (err) {
      console.error('❌ Phase 5 Product verification error:', err);
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
        port: 5010,
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

runPhase5InventoryVerification();
