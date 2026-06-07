require('dotenv').config();
const prisma = require('./config/prisma');
async function test() {
  const user = await prisma.users.findUnique({ where: { id: 1 } });
  console.log('User in DB:', user.first_name, user.last_name);
  prisma.$disconnect();
}
test();
