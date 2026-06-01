const prisma = require('./config/prisma');

async function check() {
    const b = await prisma.bookings.findMany();
    console.log("Bookings:", b);
    const fb = await prisma.flight_bookings.findMany();
    console.log("Flight Bookings:", fb);
    await prisma.$disconnect();
}
check();
