/**
 * Automated End-to-End API and Integration Verification Script
 */

const http = require('node:http');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {}
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
          } else {
            resolve({ status: res.statusCode, headers: res.headers, data });
          }
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Automated System Verification...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'API health check responds 200 OK');

    // 2. Dashboard Stats
    const stats = await request('GET', '/api/stats');
    assert(stats.status === 200 && stats.data.success === true, 'Dashboard stats fetched successfully');
    assert(stats.data.data.books.total_titles >= 20, 'Seed data initialized with at least 20 books');
    assert(stats.data.data.members.total_members >= 8, 'Seed data initialized with at least 8 members');

    // 3. Book Search & Filtering
    const searchRes = await request('GET', '/api/books?search=Clean');
    assert(searchRes.status === 200 && searchRes.data.count >= 1, 'Book search by title keyword works');

    const catRes = await request('GET', '/api/books?category=Computer%20Science');
    assert(catRes.status === 200 && catRes.data.data.every(b => b.category === 'Computer Science'), 'Category filter returns only Computer Science books');

    // 4. Create New Book
    const testIsbn = `978-${Date.now().toString().slice(-9)}`;
    const newBookRes = await request('POST', '/api/books', {
      title: 'Automated Test Book',
      author: 'Test Bot',
      isbn: testIsbn,
      category: 'Computer Science',
      total_copies: 3,
      shelf_location: 'TEST-01'
    });
    assert(newBookRes.status === 201 && newBookRes.data.success === true, 'Book creation succeeds with status 201');
    const createdBookId = newBookRes.data.data.id;

    // 5. Register New Member
    const testEmail = `testuser_${Date.now()}@example.com`;
    const newMemberRes = await request('POST', '/api/members', {
      name: 'Verification Test User',
      email: testEmail,
      phone: '+1 555-999-0000',
      membership_type: 'Student',
      max_books_allowed: 4
    });
    assert(newMemberRes.status === 201 && newMemberRes.data.success === true, 'Member registration succeeds with status 201');
    const createdMemberId = newMemberRes.data.data.id;

    // 6. Issue Book
    const issueRes = await request('POST', '/api/loans/issue', {
      book_id: createdBookId,
      member_id: createdMemberId,
      loan_days: 14,
      notes: 'Automated test issue'
    });
    assert(issueRes.status === 201 && issueRes.data.success === true, 'Book successfully issued to member');
    const loanId = issueRes.data.data.id;

    // Verify available copies decremented
    const bookCheck = await request('GET', `/api/books/${createdBookId}`);
    assert(bookCheck.data.data.available_copies === 2, 'Available copies decremented from 3 to 2');

    // 7. Renew Loan
    const renewRes = await request('POST', `/api/loans/${loanId}/renew`);
    assert(renewRes.status === 200 && renewRes.data.success === true, 'Loan renewal extends due date');

    // 8. Return Book
    const returnRes = await request('POST', `/api/loans/${loanId}/return`, { fine_paid: true });
    assert(returnRes.status === 200 && returnRes.data.success === true, 'Book return processed successfully');

    // Verify available copies restored
    const bookCheckAfter = await request('GET', `/api/books/${createdBookId}`);
    assert(bookCheckAfter.data.data.available_copies === 3, 'Available copies restored to 3 after return');

    // 9. Clean up test records
    const delBook = await request('DELETE', `/api/books/${createdBookId}`);
    assert(delBook.status === 200, 'Test book deleted successfully');

    const delMember = await request('DELETE', `/api/members/${createdMemberId}`);
    assert(delMember.status === 200, 'Test member deleted successfully');

    // 10. CSV Export verification
    const exportRes = await request('GET', '/api/export/books');
    assert(exportRes.status === 200 && typeof exportRes.data === 'string' && exportRes.data.includes('title,author,isbn'), 'Books CSV export generates valid CSV content');

    console.log(`\n=================================================`);
    console.log(`🎉 Automated Verification Summary: ${passed} passed, ${failed} failed`);
    console.log(`=================================================\n`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
