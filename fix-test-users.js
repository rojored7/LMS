// Script to fix all req.user assignments in test files
const fs = require('fs');
const path = require('path');

const testFile = path.join(__dirname, 'plataforma/backend/__tests__/middleware/authorize.test.ts');

let content = fs.readFileSync(testFile, 'utf8');

// Pattern to match req.user assignments
const pattern = /req\.user = \{([^}]+)\}/g;

// Replace function to add id field if missing
content = content.replace(pattern, (match, properties) => {
  // Check if id field already exists
  if (properties.includes('id:')) {
    return match;
  }

  // Extract userId value if it exists
  const userIdMatch = properties.match(/userId:\s*['"]([^'"]+)['"]/);
  if (userIdMatch) {
    const userId = userIdMatch[1];
    // Add id field with same value as userId
    const newProperties = `\n        id: '${userId}',` + properties;
    return `req.user = {${newProperties}}`;
  }

  return match;
});

fs.writeFileSync(testFile, content, 'utf8');
console.log('Fixed test file:', testFile);