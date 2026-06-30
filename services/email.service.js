const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: process.env.SMTP_PORT || 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send flight booking invoice email
   * @param {string} toEmail - Recipient email
   * @param {object} bookingDetails - Booking info (PNR, Names etc)
   * @param {Buffer} pdfBuffer - PDF file buffer
   */
  async sendInvoiceEmail(toEmail, bookingDetails, pdfBuffer) {
    try {
      const passengerName = bookingDetails.passengerName || 'Traveler';
      const pnr = bookingDetails.pnr || 'PENDING';

      const mailOptions = {
        from: `"FlyAnyTrip" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Your Flight Booking is Confirmed - PNR: ${pnr}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #E21C26;">Thanks for choosing FlyAnyTrip!</h2>
            <p>Dear <strong>${passengerName}</strong>,</p>
            <p>Your flight booking has been successfully confirmed. ${pdfBuffer ? 'Please find your e-ticket and invoice attached to this email.' : ''}</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #333;">Booking Summary</h4>
              <p style="margin: 5px 0;"><strong>PNR:</strong> ${pnr}</p>
              <p style="margin: 5px 0;"><strong>Route:</strong> ${bookingDetails.origin} to ${bookingDetails.destination}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${bookingDetails.departureDate}</p>
            </div>

            <p>We recommend arriving at the airport at least 2 hours before your domestic flight and 3 hours before an international flight.</p>
            <p>If you have any questions or need to make changes to your booking, feel free to contact our support team.</p>
            
            <br/>
            <p>Wishing you a pleasant journey,</p>
            <p><strong>Team FlyAnyTrip</strong></p>
          </div>
        `,
        attachments: pdfBuffer ? [
          {
            filename: `FlyAnyTrip_Invoice_${pnr}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ] : [],
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Invoice email sent successfully. Message ID:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending invoice email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send hotel booking invoice email
   * @param {string} toEmail - Recipient email
   * @param {object} bookingDetails - Booking info
   * @param {Buffer} pdfBuffer - PDF file buffer
   */
  async sendHotelInvoiceEmail(toEmail, bookingDetails, pdfBuffer) {
    try {
      const passengerName = bookingDetails.guestName || 'Traveler';
      const bookingRef = bookingDetails.bookingReference || 'PENDING';

      const mailOptions = {
        from: `"FlyAnyTrip" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Your Hotel Booking is Confirmed - Ref: ${bookingRef}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #E21C26;">Thanks for choosing FlyAnyTrip!</h2>
            <p>Dear <strong>${passengerName}</strong>,</p>
            <p>Your hotel booking has been successfully confirmed. ${pdfBuffer ? 'Please find your reservation details and invoice attached to this email.' : ''}</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #333;">Booking Summary</h4>
              <p style="margin: 5px 0;"><strong>Reference:</strong> ${bookingRef}</p>
              <p style="margin: 5px 0;"><strong>Hotel:</strong> ${bookingDetails.hotelName}</p>
              <p style="margin: 5px 0;"><strong>Check-in:</strong> ${bookingDetails.checkIn}</p>
              <p style="margin: 5px 0;"><strong>Check-out:</strong> ${bookingDetails.checkOut}</p>
            </div>

            <p>Please present a valid photo ID matching the guest name during check-in.</p>
            <p>If you have any questions or need to make changes to your booking, feel free to contact our support team.</p>
            
            <br/>
            <p>Have a wonderful stay,</p>
            <p><strong>Team FlyAnyTrip</strong></p>
          </div>
        `,
        attachments: pdfBuffer ? [
          {
            filename: `FlyAnyTrip_Hotel_Invoice_${bookingRef}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ] : [],
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Hotel invoice email sent successfully. Message ID:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending hotel invoice email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
