const { PrismaClient } = require('@prisma/client');

console.log("Testing Prisma initialization...");

try {
  const p1 = new PrismaClient({ log: ['info', 'query'] });
  console.log("log init SUCCESS");
} catch (e) {
  console.log("log init FAILED:", e.message.split('\n')[0]);
}

try {
  const p2 = new PrismaClient({ adapter: null });
  console.log("adapter init SUCCESS");
} catch (e) {
  console.log("adapter init FAILED:", e.message.split('\n')[0]);
}
