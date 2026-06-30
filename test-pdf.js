const { getHotelInvoiceDocDefinition } = require('./utils/hotelInvoiceTemplate');
const pdfService = require('./services/pdf.service');

async function test() {
  try {
    const invoiceData = {
      bookingId: 'test-123',
      bookingReference: 'REF-123',
      orderId: 'ORD-123',
      hotelName: 'Test Hotel',
      hotelAddress: '123 Test St',
      checkIn: '2023-01-01',
      checkOut: '2023-01-02',
      nightCount: 1,
      rooms: 1,
      adults: 1,
      children: 0,
      roomType: 'Deluxe',
      boardPlan: 'BB',
      totalFare: 1000,
      status: 'CONFIRMED',
      contactEmail: 'test@example.com',
      contactPhone: '1234567890',
      guestName: 'John Doe',
      bookingDate: '2023-01-01'
    };

    console.log("Generating doc definition...");
    const docDef = getHotelInvoiceDocDefinition(invoiceData);
    
    console.log("Generating PDF buffer...");
    const pdfBuffer = await pdfService.generatePdf(docDef);
    
    console.log("Success! Buffer size:", pdfBuffer.length);
  } catch (err) {
    console.error("FAILED:");
    console.error(err);
  }
}
test();
