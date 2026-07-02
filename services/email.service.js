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
  /**
   * Send flight booking cancellation confirmation email
   * @param {string} toEmail - Recipient email
   * @param {object} details - Cancellation details
   */
  async sendCancellationEmail(toEmail, details) {
    try {
      const {
        passengerName = 'Traveler',
        pnr = 'N/A',
        bookingId = 'N/A',
        origin = 'Origin',
        destination = 'Destination',
        departureDate = 'N/A',
        airline = 'N/A',
        flightNumber = 'N/A',
        totalFare = 0,
        cancellationCharge = 0,
        refundAmount = 0,
        changeRequestId = 'N/A',
        cancelledAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        remarks = '',
        passengers = [],
      } = details;

      const formatINR = (amount) =>
        `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const passengerRows = passengers.length
        ? passengers
            .map(
              (p) => `
          <tr>
            <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0;">${p.firstName || ''} ${p.lastName || ''}</td>
            <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0; color:#888;">${p.paxType || 'Adult'}</td>
          </tr>`
            )
            .join('')
        : `<tr><td colspan="2" style="padding:8px 12px; color:#888;">N/A</td></tr>`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Flight Cancellation Confirmed – FlyAnyTrip</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#E21C26 0%,#b01219 100%);padding:0;">
    <tr>
      <td align="center" style="padding:32px 20px 28px;">
        <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;letter-spacing:0.5px;">✈ FlyAnyTrip</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Booking Cancellation Confirmed</p>
      </td>
    </tr>
  </table>

  <!-- Body wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 16px 40px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 0;">
              <p style="margin:0;font-size:15px;color:#444;">Dear <strong style="color:#222;">${passengerName}</strong>,</p>
              <p style="margin:12px 0 0;font-size:15px;color:#555;line-height:1.6;">
                Your flight booking has been <strong style="color:#E21C26;">successfully cancelled</strong>. 
                Please find the complete cancellation summary below.
              </p>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding:20px 32px;">
              <div style="display:inline-block;background:#fff5f5;border:1.5px solid #E21C26;border-radius:8px;padding:10px 20px;">
                <span style="color:#E21C26;font-weight:700;font-size:13px;letter-spacing:0.5px;">🚫 CANCELLATION CONFIRMED</span>
              </div>
            </td>
          </tr>

          <!-- Flight Info -->
          <tr>
            <td style="padding:0 32px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.8px;">Flight Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:5px 0;font-size:14px;color:#666;width:48%;">📋 <strong>PNR:</strong></td>
                        <td style="padding:5px 0;font-size:14px;color:#222;font-weight:600;">${pnr}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:14px;color:#666;">🔖 <strong>Booking ID:</strong></td>
                        <td style="padding:5px 0;font-size:14px;color:#222;">${bookingId}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:14px;color:#666;">✈ <strong>Route:</strong></td>
                        <td style="padding:5px 0;font-size:14px;color:#222;">${origin} → ${destination}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:14px;color:#666;">📅 <strong>Departure:</strong></td>
                        <td style="padding:5px 0;font-size:14px;color:#222;">${departureDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:14px;color:#666;">🏷 <strong>Airline:</strong></td>
                        <td style="padding:5px 0;font-size:14px;color:#222;">${airline} (${flightNumber})</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:14px;color:#666;">🕐 <strong>Cancelled At:</strong></td>
                        <td style="padding:5px 0;font-size:14px;color:#222;">${cancelledAt}</td>
                      </tr>
                      ${changeRequestId !== 'N/A' ? `
                      <tr>
                        <td style="padding:5px 0;font-size:14px;color:#666;">🔑 <strong>Request ID:</strong></td>
                        <td style="padding:5px 0;font-size:14px;color:#222;">${changeRequestId}</td>
                      </tr>` : ''}
                      ${remarks ? `
                      <tr>
                        <td style="padding:5px 0;font-size:14px;color:#666;">💬 <strong>Reason:</strong></td>
                        <td style="padding:5px 0;font-size:14px;color:#222;">${remarks}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Passengers -->
          <tr>
            <td style="padding:0 32px 20px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.8px;">Passengers</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;font-size:14px;">
                <tr style="background:#f8f9fb;">
                  <th style="padding:8px 12px;text-align:left;color:#555;font-weight:600;">Name</th>
                  <th style="padding:8px 12px;text-align:left;color:#555;font-weight:600;">Type</th>
                </tr>
                ${passengerRows}
              </table>
            </td>
          </tr>

          <!-- Charges Breakdown -->
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.8px;">Charge Breakdown</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;font-size:14px;">
                <tr>
                  <td style="padding:12px 16px;color:#555;border-bottom:1px solid #f0f0f0;">Original Ticket Fare</td>
                  <td style="padding:12px 16px;text-align:right;font-weight:600;color:#333;border-bottom:1px solid #f0f0f0;">${formatINR(totalFare)}</td>
                </tr>
                <tr style="background:#fff5f5;">
                  <td style="padding:12px 16px;color:#E21C26;border-bottom:1px solid #f0f0f0;">
                    ✂ Cancellation Charge
                    <br/><span style="font-size:11px;color:#aaa;">(Airline penalty + processing fee)</span>
                  </td>
                  <td style="padding:12px 16px;text-align:right;font-weight:700;color:#E21C26;border-bottom:1px solid #f0f0f0;">- ${formatINR(cancellationCharge)}</td>
                </tr>
                <tr style="background:#f0fdf4;">
                  <td style="padding:14px 16px;font-weight:700;color:#15803d;font-size:15px;">💰 Estimated Refund</td>
                  <td style="padding:14px 16px;text-align:right;font-weight:700;color:#15803d;font-size:16px;">${formatINR(refundAmount)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Refund Info -->
          <tr>
            <td style="padding:0 32px 24px;">
              <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;">
                <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">⏳ Refund Timeline</p>
                <p style="margin:8px 0 0;font-size:13px;color:#78350f;line-height:1.6;">
                  The refund of <strong>${formatINR(refundAmount)}</strong> will be credited to your original payment method 
                  within <strong>5–7 business days</strong>. For credit card refunds, it may take up to 10 business days 
                  depending on your bank.
                </p>
              </div>
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
                If you have any questions regarding your cancellation or refund, please reach out to our support team at 
                <a href="mailto:support@flyanytrip.com" style="color:#E21C26;text-decoration:none;font-weight:600;">support@flyanytrip.com</a> 
                or call us at <strong>+91-XXXXXXXXXX</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fb;padding:20px 32px;border-top:1px solid #eee;">
              <p style="margin:0;font-size:13px;color:#999;text-align:center;">
                We hope to serve you again soon. 🙏<br/>
                <strong style="color:#E21C26;">Team FlyAnyTrip</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

      const mailOptions = {
        from: `"FlyAnyTrip" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Booking Cancelled: ${origin} → ${destination} | PNR: ${pnr} – Refund ${formatINR(refundAmount)}`,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Cancellation email sent successfully. Message ID:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending cancellation email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
