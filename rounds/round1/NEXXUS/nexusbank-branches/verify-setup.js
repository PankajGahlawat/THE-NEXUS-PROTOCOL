#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying NexusBank Setup...\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function check(condition, message, type = 'error') {
  if (condition) {
    console.log(`✅ ${message}`);
    checks.passed++;
  } else {
    if (type === 'warning') {
      console.log(`⚠️  ${message}`);
      checks.warnings++;
    } else {
      console.log(`❌ ${message}`);
      checks.failed++;
    }
  }
}

// Check branch directories
const branches = ['branch-a', 'branch-b', 'branch-c'];
branches.forEach(branch => {
  check(
    fs.existsSync(branch),
    `${branch} directory exists`
  );
  
  // Check backend
  check(
    fs.existsSync(path.join(branch, 'backend', 'server.js')),
    `${branch}/backend/server.js exists`
  );
  
  check(
    fs.existsSync(path.join(branch, 'backend', 'package.json')),
    `${branch}/backend/package.json exists`
  );
  
  // Check frontend
  check(
    fs.existsSync(path.join(branch, 'frontend', 'src', 'App.jsx')),
    `${branch}/frontend/src/App.jsx exists`
  );
  
  check(
    fs.existsSync(path.join(branch, 'frontend', 'vite.config.js')),
    `${branch}/frontend/vite.config.js exists`
  );
  
  check(
    fs.existsSync(path.join(branch, 'frontend', 'src', 'index.css')),
    `${branch}/frontend/src/index.css exists`
  );
});

// Check specific components
check(
  fs.existsSync('branch-a/frontend/src/components/Layout.jsx'),
  'Branch A Layout component exists'
);

check(
  fs.existsSync('branch-b/frontend/src/components/Layout.jsx'),
  'Branch B Layout component exists'
);

check(
  fs.existsSync('branch-c/frontend/src/components/Layout.jsx'),
  'Branch C Layout component exists'
);

// Check vite configs for correct ports
const viteConfigs = {
  'branch-a': { frontend: 5173, backend: 3001 },
  'branch-b': { frontend: 5174, backend: 3002 },
  'branch-c': { frontend: 5175, backend: 3003 }
};

Object.entries(viteConfigs).forEach(([branch, ports]) => {
  const configPath = path.join(branch, 'frontend', 'vite.config.js');
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    check(
      content.includes(`port: ${ports.frontend}`),
      `${branch} frontend configured for port ${ports.frontend}`
    );
    check(
      content.includes(`localhost:${ports.backend}`),
      `${branch} frontend proxies to backend port ${ports.backend}`
    );
  }
});

// Check for node_modules (warning only)
branches.forEach(branch => {
  check(
    fs.existsSync(path.join(branch, 'backend', 'node_modules')),
    `${branch}/backend/node_modules exists (run npm install if missing)`,
    'warning'
  );
  
  check(
    fs.existsSync(path.join(branch, 'frontend', 'node_modules')),
    `${branch}/frontend/node_modules exists (run npm install if missing)`,
    'warning'
  );
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Summary:');
console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);
console.log('='.repeat(50));

if (checks.failed === 0) {
  console.log('\n🎉 All critical checks passed! Setup looks good.');
  console.log('\n📝 Next steps:');
  console.log('1. Install dependencies: npm install in each backend/frontend folder');
  console.log('2. Start servers: Use start.sh (Linux/Mac) or start-windows.bat (Windows)');
  console.log('3. Access applications:');
  console.log('   - Branch A: http://localhost:5173');
  console.log('   - Branch B: http://localhost:5174');
  console.log('   - Branch C: http://localhost:5175');
} else {
  console.log('\n⚠️  Some checks failed. Please review the errors above.');
  process.exit(1);
}
