require('dotenv').config();
const prisma = require('./config/prisma');

prisma.users.findUnique({ where: { email: 'test@test.com' } })
  .then(console.log)
  .catch(e => console.log('ERROR:', e.code, e.message))
  .finally(() => prisma.$disconnect());
