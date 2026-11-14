/**
 * Diagnostic Script: Test Category Query Variations against live DNEXT DPC Gateway
 * 
 * Usage:
 *   node scripts/test_category_query.js <TOKEN> [CATEGORY_ID]
 * Or:
 *   DNEXT_TOKEN="<your_bearer_token>" node scripts/test_category_query.js [CATEGORY_ID]
 */

const https = require('https');

const API_BASE = process.env.DNEXT_API_URL || 'https://dpc-api.test-gcu.com';
const TOKEN = process.argv[2] || process.env.DNEXT_TOKEN || '';
const CATEGORY_ID = process.argv[3] || 'FN155'; // Default: DSL_total

if (!TOKEN || TOKEN.startsWith('FN')) {
  console.log('\n============================================================');
  console.log('  DNEXT API Category Query Test Suite');
  console.log('============================================================');
  console.log('\nError: Bearer token is required to test against remote gateway.\n');
  console.log('Usage:');
  console.log('  node scripts/test_category_query.js <BEARER_TOKEN> [CATEGORY_ID]\n');
  console.log('Example:');
  console.log('  node scripts/test_category_query.js "eyJhbGciOi..." FN155\n');
  console.log('(You can copy your active token from browser dev tools: localStorage.getItem("dnext_token"))\n');
  process.exit(1);
}

const CANDIDATES = [
  {
    name: '1. Nested TMF Dot-Notation (extensions.categoryGroupings.category.id)',
    path: `/api/productCatalogManagement/v4/productOffering?extensions.categoryGroupings.category.id=${encodeURIComponent(CATEGORY_ID)}&limit=10`
  },
  {
    name: '2. Unwrapped Dot-Notation (categoryGroupings.category.id)',
    path: `/api/productCatalogManagement/v4/productOffering?categoryGroupings.category.id=${encodeURIComponent(CATEGORY_ID)}&limit=10`
  },
  {
    name: '3. Root TMF Category (category.id)',
    path: `/api/productCatalogManagement/v4/productOffering?category.id=${encodeURIComponent(CATEGORY_ID)}&limit=10`
  },
  {
    name: '4. TMF Operator Expression (extensions.categoryGroupings.category.id.eq)',
    path: `/api/productCatalogManagement/v4/productOffering?extensions.categoryGroupings.category.id.eq=${encodeURIComponent(CATEGORY_ID)}&limit=10`
  },
  {
    name: '5. Category Resource Direct Query (/category/{id})',
    path: `/api/productCatalogManagement/v4/category/${encodeURIComponent(CATEGORY_ID)}`
  },
  {
    name: '6. Nested Dot-Notation WITH lifecycleStatus (extensions.categoryGroupings.category.id + lifecycleStatus)',
    path: `/api/productCatalogManagement/v4/productOffering?extensions.categoryGroupings.category.id=${encodeURIComponent(CATEGORY_ID)}&lifecycleStatus=Launched,In%20test,In%20study,Retired,Obsolete&limit=10`
  }
];

function fetchEndpoint(urlPath) {
  return new Promise((resolve) => {
    const fullUrl = new URL(urlPath, API_BASE);
    const req = https.request(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': TOKEN.startsWith('Bearer ') ? TOKEN : `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
          rawUrl: fullUrl.toString()
        });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 500, error: err.message, rawUrl: fullUrl.toString() });
    });

    req.end();
  });
}

async function runTests() {
  console.log('\n============================================================');
  console.log(`  Testing Category Query Candidates against: ${API_BASE}`);
  console.log(`  Target Category ID: ${CATEGORY_ID}`);
  console.log('============================================================\n');

  for (const c of CANDIDATES) {
    process.stdout.write(`Testing: ${c.name} ... `);
    const result = await fetchEndpoint(c.path);

    if (result.status === 200) {
      if (Array.isArray(result.data)) {
        const count = result.data.length;
        const totalCount = result.headers['x-total-count'] || count;
        console.log(`\x1b[32m[HTTP 200 OK]\x1b[0m returned ${count} items (total: ${totalCount})`);
        if (count > 0) {
          const sample = result.data.slice(0, 3).map(o => `${o.id} ("${o.name}")`).join(', ');
          console.log(`   Sample matches: ${sample}`);
        } else {
          console.log('   (Empty array returned)');
        }
      } else if (result.data && typeof result.data === 'object') {
        const poCount = Array.isArray(result.data.productOffering) ? result.data.productOffering.length : 0;
        console.log(`\x1b[32m[HTTP 200 OK]\x1b[0m returned Category object with ${poCount} linked productOfferings`);
        if (poCount > 0) {
          const sample = result.data.productOffering.slice(0, 3).map(p => `${p.id} ("${p.name}")`).join(', ');
          console.log(`   Sample linked offerings: ${sample}`);
        }
      }
    } else if (result.status === 400) {
      console.log(`\x1b[31m[HTTP 400 Bad Request]\x1b[0m - Parameter not supported by gateway.`);
    } else if (result.status === 401 || result.status === 403) {
      console.log(`\x1b[33m[HTTP ${result.status}]\x1b[0m - Authentication expired or unauthorized.`);
    } else {
      console.log(`\x1b[35m[HTTP ${result.status}]\x1b[0m`);
    }
    console.log(`   URL: ${result.rawUrl}\n`);
  }
}

runTests();
