const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.nehuscltvnuuqkhtttao:Alispatel%402003@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
    }
  }
});
async function test() {
  try {
    const user = await prisma.users.findUnique({ where: { id: 1 } });
    console.log('User fetched via pooler:', user.email);
  } catch(e) {
    console.error('Error via pooler:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
