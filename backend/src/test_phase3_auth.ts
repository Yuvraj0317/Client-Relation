import app from './server';
import http from 'http';
import { prisma } from './prisma';

async function runPhase3AuthVerification() {
  console.log('🧪 Starting Phase 3 Authentication & Authorization Verification Suite...\n');

  // Start Express server on test port 5006
  const server = app.listen(5006, async () => {
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

      // 1. Valid Login (Admin)
      const validLoginRes = await makeRequest('POST', '/api/auth/login', {
        email: 'admin@fundsroom.com',
        password: 'Password123!',
      });
      const adminToken = validLoginRes.data.token || validLoginRes.data.data?.token;
      const adminUser = validLoginRes.data.user || validLoginRes.data.data?.user;
      assertTest(
        'Valid Login',
        validLoginRes.status === 200 && !!adminToken && adminUser.email === 'admin@fundsroom.com',
        `HTTP ${validLoginRes.status}, User: ${adminUser?.name}, Role: ${adminUser?.role}`
      );

      // Login Sales User to get Sales Token
      const salesLoginRes = await makeRequest('POST', '/api/auth/login', {
        email: 'sales@fundsroom.com',
        password: 'Password123!',
      });
      const salesToken = salesLoginRes.data.token || salesLoginRes.data.data?.token;

      // 2. Invalid Password
      const invalidPassRes = await makeRequest('POST', '/api/auth/login', {
        email: 'admin@fundsroom.com',
        password: 'WrongPassword!',
      });
      assertTest(
        'Invalid Password Rejection',
        invalidPassRes.status === 401,
        `HTTP ${invalidPassRes.status}, Message: "${invalidPassRes.data.error?.message}"`
      );

      // 3. Invalid Email
      const invalidEmailRes = await makeRequest('POST', '/api/auth/login', {
        email: 'nonexistent@fundsroom.com',
        password: 'Password123!',
      });
      assertTest(
        'Invalid Email Rejection',
        invalidEmailRes.status === 401,
        `HTTP ${invalidEmailRes.status}, Message: "${invalidEmailRes.data.error?.message}"`
      );

      // 4. Missing Token on Protected Route
      const missingTokenRes = await makeRequest('GET', '/api/auth/me');
      assertTest(
        'Missing Token Rejection',
        missingTokenRes.status === 401,
        `HTTP ${missingTokenRes.status}, Code: ${missingTokenRes.data.error?.code}`
      );

      // 5. Invalid Token on Protected Route
      const invalidTokenRes = await makeRequest('GET', '/api/auth/me', null, 'invalid.bearer.jwt.token');
      assertTest(
        'Invalid Token Rejection',
        invalidTokenRes.status === 401,
        `HTTP ${invalidTokenRes.status}, Code: ${invalidTokenRes.data.error?.code}`
      );

      // 6. Valid Token Profile Retrieval
      const validTokenRes = await makeRequest('GET', '/api/auth/me', null, adminToken);
      assertTest(
        'Valid Token Access',
        validTokenRes.status === 200 && validTokenRes.data.user?.email === 'admin@fundsroom.com',
        `HTTP ${validTokenRes.status}, Profile Name: "${validTokenRes.data.user?.name}"`
      );

      // 7. Unauthorized Role Access (Sales user attempting Admin-only endpoint)
      const unauthRoleRes = await makeRequest('GET', '/api/auth/test-admin', null, salesToken);
      assertTest(
        'Unauthorized Role Rejection',
        unauthRoleRes.status === 403,
        `HTTP ${unauthRoleRes.status}, Code: ${unauthRoleRes.data.error?.code}, Msg: "${unauthRoleRes.data.error?.message}"`
      );

      // 8. Authorized Role Access (Sales user accessing Sales-authorized endpoint)
      const authRoleRes = await makeRequest('GET', '/api/auth/test-sales', null, salesToken);
      assertTest(
        'Authorized Role Access',
        authRoleRes.status === 200,
        `HTTP ${authRoleRes.status}, Message: "${authRoleRes.data.message}"`
      );

      console.log(`\n🎉 PHASE 3 VERIFICATION COMPLETE: ${passedCount}/${totalCount} TESTS PASSED!`);
    } catch (err) {
      console.error('❌ Phase 3 Auth verification error:', err);
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
        port: 5006,
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

runPhase3AuthVerification();
