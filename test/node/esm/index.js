if ('Bun' in globalThis) {
  throw new Error('❌ Use Node.js to run this test!');
}

import { cors } from '@elysiajs/cors';

if (typeof cors !== 'function') {
  throw new Error('❌ ESM Node.js failed');
}

console.log('✅ ESM Node.js works!');
