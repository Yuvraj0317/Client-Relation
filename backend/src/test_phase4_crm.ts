import app from './server';
import http from 'http';
import { prisma } from './prisma';

async function runPhase4CrmVerification() {
  console.log('🧪 Starting Phase 4 Customer CRM Verification Suite...\n');

  const server = app.listen(5007, async () => {
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

      // 1. Authenticate Sales User
      const salesAuthRes = await makeRequest('POST', '/api/auth/login', {
        email: 'sales@fundsroom.com',
        password: 'Password123!',
      });
      const salesToken = salesAuthRes.data.token || salesAuthRes.data.data?.token;

      // Authenticate Warehouse User for RBAC testing
      const warehouseAuthRes = await makeRequest('POST', '/api/auth/login', {
        email: 'warehouse@fundsroom.com',
        password: 'Password123!',
      });
      const warehouseToken = warehouseAuthRes.data.token || warehouseAuthRes.data.data?.token;

      // 2. Create Customer (Sales Role)
      const newCustomerEmail = `crm_test_${Date.now()}@example.com`;
      const createCustRes = await makeRequest(
        'POST',
        '/api/customers',
        {
          name: 'Starlight Electronics',
          companyName: 'Starlight Retailers Ltd',
          email: newCustomerEmail,
          phone: '+91 9887766554',
          address: 'Building 12, Tech Park, Pune',
          customerType: 'WHOLESALE',
          status: 'ACTIVE',
        },
        salesToken
      );

      const createdCust = createCustRes.data.data || createCustRes.data;
      assertTest(
        'Create Customer (Sales Role)',
        createCustRes.status === 201 && createdCust.email === newCustomerEmail,
        `HTTP ${createCustRes.status}, Customer ID: ${createdCust?.id}, Name: "${createdCust?.name}"`
      );

      // 3. Duplicate Email Rejection (409 Conflict)
      const duplicateCustRes = await makeRequest(
        'POST',
        '/api/customers',
        {
          name: 'Starlight Duplicate',
          phone: '+91 9887766554',
          email: newCustomerEmail, // Same email
          address: 'Pune',
        },
        salesToken
      );

      assertTest(
        'Duplicate Email Rejection (409 Conflict)',
        duplicateCustRes.status === 409,
        `HTTP ${duplicateCustRes.status}, Error Code: ${duplicateCustRes.data.error?.code}`
      );

      // 4. RBAC Rejection (Warehouse role attempting to create customer)
      const rbacCustRes = await makeRequest(
        'POST',
        '/api/customers',
        {
          name: 'Unauthorized Customer Attempt',
          phone: '+91 1234567890',
          address: 'Delhi',
        },
        warehouseToken
      );

      assertTest(
        'RBAC Rejection (Warehouse cannot create Customer)',
        rbacCustRes.status === 403,
        `HTTP ${rbacCustRes.status}, Error Code: ${rbacCustRes.data.error?.code}`
      );

      // 5. List Customers with Query Filtering
      const listCustRes = await makeRequest(
        'GET',
        `/api/customers?search=Starlight&customerType=WHOLESALE&status=ACTIVE`,
        null,
        salesToken
      );

      const customerList = listCustRes.data.data || listCustRes.data;
      assertTest(
        'List Customers with Search & Filters',
        listCustRes.status === 200 && Array.isArray(customerList) && customerList.length > 0,
        `HTTP ${listCustRes.status}, Matching Customers Found: ${customerList.length}`
      );

      // 6. Add Customer Follow-up Note
      const followUpDate = new Date(Date.now() + 86400000 * 5).toISOString();
      const addFollowUpRes = await makeRequest(
        'POST',
        `/api/customers/${createdCust.id}/follow-ups`,
        {
          note: 'Discussed bulk pricing and delivery schedules for Pune warehouse.',
          followUpDate,
        },
        salesToken
      );

      const addedFollowUp = addFollowUpRes.data.data || addFollowUpRes.data;
      assertTest(
        'Add Follow-up Note',
        addFollowUpRes.status === 201 && !!addedFollowUp.id,
        `HTTP ${addFollowUpRes.status}, Note ID: ${addedFollowUp?.id}`
      );

      // 7. Get Customer Follow-up Timeline Notes
      const getFollowUpsRes = await makeRequest(
        'GET',
        `/api/customers/${createdCust.id}/follow-ups`,
        null,
        salesToken
      );

      const followUpList = getFollowUpsRes.data.data || getFollowUpsRes.data;
      assertTest(
        'Retrieve Follow-up Timeline Notes',
        getFollowUpsRes.status === 200 && Array.isArray(followUpList) && followUpList.length > 0,
        `HTTP ${getFollowUpsRes.status}, Timeline Notes Count: ${followUpList.length}`
      );

      console.log(`\n🎉 PHASE 4 VERIFICATION COMPLETE: ${passedCount}/${totalCount} TESTS PASSED!`);
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
        port: 5007,
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
