require('dotenv').config();
const prisma = require('./config/prisma');
async function test() {
  try {
    const user = await prisma.users.findUnique({
      where: { email: 'alispatel123098@gmail.com' }
    });
    console.log('User:', user);
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
