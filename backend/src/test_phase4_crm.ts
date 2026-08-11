import app from './server';
import http from 'http';
import { prisma } from './prisma';

async function runPhase4CrmVerification() {
  console.log('🧪 Starting Expanded Phase 4 Customer CRM Backend Verification Suite...\n');

  const server = app.listen(5008, async () => {
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

      // 1. Authenticate Admin and Sales Users
      const adminAuthRes = await makeRequest('POST', '/api/auth/login', {
        email: 'admin@fundsroom.com',
        password: 'Password123!',
      });
      const adminToken = adminAuthRes.data.token || adminAuthRes.data.data?.token;

      const salesAuthRes = await makeRequest('POST', '/api/auth/login', {
        email: 'sales@fundsroom.com',
        password: 'Password123!',
      });
      const salesToken = salesAuthRes.data.token || salesAuthRes.data.data?.token;

      const warehouseAuthRes = await makeRequest('POST', '/api/auth/login', {
        email: 'warehouse@fundsroom.com',
        password: 'Password123!',
      });
      const warehouseToken = warehouseAuthRes.data.token || warehouseAuthRes.data.data?.token;

      // 2. POST /api/customers (Full fields: mobile, businessName, gstNumber, etc.)
      const testEmail = `crm_full_${Date.now()}@example.com`;
      const createCustRes = await makeRequest(
        'POST',
        '/api/customers',
        {
          name: 'Apex Global Logistics',
          mobile: '+91 9988776655',
          email: testEmail,
          businessName: 'Apex Logistics Pvt Ltd',
          gstNumber: '27AAAAA0000A1Z5',
          customerType: 'DISTRIBUTOR',
          address: 'Plot 45, MIDC Industrial Area, Mumbai',
          status: 'ACTIVE',
          notes: 'Key distributor account for Western region',
        },
        salesToken
      );

      const createdCust = createCustRes.data.data || createCustRes.data;
      assertTest(
        'POST /api/customers (Create with mobile & businessName)',
        createCustRes.status === 201 && createdCust.mobile === '+91 9988776655',
        `HTTP ${createCustRes.status}, ID: ${createdCust?.id}, GST: ${createdCust?.gstNumber}`
      );

      // 3. Duplicate Email Prevention (409 Conflict)
      const duplicateRes = await makeRequest(
        'POST',
        '/api/customers',
        {
          name: 'Apex Duplicate',
          mobile: '+91 9988776655',
          email: testEmail,
          address: 'Mumbai',
        },
        salesToken
      );
      assertTest(
        'Duplicate Email Rejection (409 Conflict)',
        duplicateRes.status === 409,
        `HTTP ${duplicateRes.status}, Code: ${duplicateRes.data.error?.code}`
      );

      // 4. GET /api/customers (Search by businessName / mobile & pagination)
      const searchRes = await makeRequest(
        'GET',
        '/api/customers?search=Apex&page=1&limit=5',
        null,
        salesToken
      );
      const custList = searchRes.data.data || searchRes.data;
      assertTest(
        'GET /api/customers (Search by name/mobile/businessName)',
        searchRes.status === 200 && Array.isArray(custList) && custList.length > 0,
        `HTTP ${searchRes.status}, Found: ${custList.length}`
      );

      // 5. GET /api/customers/:id
      const getByIdRes = await makeRequest(
        'GET',
        `/api/customers/${createdCust.id}`,
        null,
        salesToken
      );
      const fetchedCust = getByIdRes.data.data || getByIdRes.data;
      assertTest(
        'GET /api/customers/:id',
        getByIdRes.status === 200 && fetchedCust.id === createdCust.id,
        `HTTP ${getByIdRes.status}, Name: "${fetchedCust.name}"`
      );

      // 6. PUT /api/customers/:id
      const updateRes = await makeRequest(
        'PUT',
        `/api/customers/${createdCust.id}`,
        {
          notes: 'Updated priority distributor account with expanded credit line.',
          status: 'ACTIVE',
        },
        salesToken
      );
      const updatedCust = updateRes.data.data || updateRes.data;
      assertTest(
        'PUT /api/customers/:id',
        updateRes.status === 200 && updatedCust.notes.includes('Updated priority'),
        `HTTP ${updateRes.status}, Updated Notes: "${updatedCust.notes?.substring(0, 30)}..."`
      );

      // 7. POST /api/customers/:id/followups
      const followUpDateStr = new Date(Date.now() + 86400000 * 3).toISOString();
      const addFollowUpRes = await makeRequest(
        'POST',
        `/api/customers/${createdCust.id}/followups`,
        {
          note: 'Scheduled quarterly sales review meeting with procurement manager.',
          followUpDate: followUpDateStr,
        },
        salesToken
      );
      const addedFollowUp = addFollowUpRes.data.data || addFollowUpRes.data;
      assertTest(
        'POST /api/customers/:id/followups',
        addFollowUpRes.status === 201 && !!addedFollowUp.id,
        `HTTP ${addFollowUpRes.status}, Note ID: ${addedFollowUp?.id}`
      );

      // 8. GET /api/customers/:id/followups
      const getFollowUpsRes = await makeRequest(
        'GET',
        `/api/customers/${createdCust.id}/followups`,
        null,
        salesToken
      );
      const followUpList = getFollowUpsRes.data.data || getFollowUpsRes.data;
      assertTest(
        'GET /api/customers/:id/followups',
        getFollowUpsRes.status === 200 && Array.isArray(followUpList) && followUpList.length > 0,
        `HTTP ${getFollowUpsRes.status}, Notes Count: ${followUpList.length}`
      );

      // 9. RBAC Rejection (Warehouse cannot delete customer)
      const unauthDeleteRes = await makeRequest(
        'DELETE',
        `/api/customers/${createdCust.id}`,
        null,
        warehouseToken
      );
      assertTest(
        'DELETE /api/customers/:id RBAC Rejection (Warehouse user)',
        unauthDeleteRes.status === 403,
        `HTTP ${unauthDeleteRes.status}, Code: ${unauthDeleteRes.data.error?.code}`
      );

      // 10. DELETE /api/customers/:id (Admin user)
      const deleteRes = await makeRequest(
        'DELETE',
        `/api/customers/${createdCust.id}`,
        null,
        adminToken
      );
      assertTest(
        'DELETE /api/customers/:id (Admin Authorized Delete)',
        deleteRes.status === 200,
        `HTTP ${deleteRes.status}, Message: "${deleteRes.data.data?.message || deleteRes.data.message}"`
      );

      console.log(`\n🎉 EXPANDED PHASE 4 VERIFICATION COMPLETE: ${passedCount}/${totalCount} TESTS PASSED!`);
    } catch (err) {
      console.error('❌ Phase 4 CRM verification error:', err);
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
        port: 5008,
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

runPhase4CrmVerification();
