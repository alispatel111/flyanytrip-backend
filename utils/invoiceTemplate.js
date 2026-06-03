const getInvoiceHTML = (bookingData) => {
  const {
    pnr = 'PENDING',
    bookingId = 'N/A',
    bookingDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    passengers = [],
    origin = 'XXX',
    destination = 'XXX',
    departureDate = 'N/A',
    arrivalDate = 'N/A',
    airline = 'XX',
    flightNumber = 'XX-000',
    cabinClass = 'Economy',
    totalFare = 0,
    baseFare = 0,
    taxes = 0,
    status = 'CONFIRMED',
    contactEmail = 'N/A',
    contactPhone = 'N/A',
    gstNumber = 'N/A',
    state = 'N/A'
  } = bookingData;

  // Generate passenger rows
  const passengerRows = passengers.map((pax, index) => {
    let extraInfo = '';
    if (pax.passportNo !== 'N/A') {
      extraInfo = `<br><span style="font-size: 11px; color: #718096; font-weight: normal;">Passport: ${pax.passportNo} | Exp: ${pax.passportExpiry}</span>`;
    }
    
    return `
    <tr>
      <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0;">${index + 1}</td>
      <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">
        ${pax.firstName} ${pax.lastName}
        ${extraInfo}
      </td>
      <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0;">${pax.gender || 'N/A'}</td>
      <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0;">${pax.dob !== 'N/A' ? pax.dob : '-'}</td>
      <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0;">${pax.baggage}</td>
      <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0;">${pax.meal}</td>
      <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0; color: #4caf50; font-weight: 600;">${pax.ticketStatus || status}</td>
    </tr>
    `;
  }).join('');

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <title>E-Ticket | FlyAnyTrip - ${pnr}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      body {
        font-family: 'Inter', sans-serif;
        color: #2D3748;
        margin: 0;
        padding: 0;
        background-color: #F7FAFC;
        -webkit-font-smoothing: antialiased;
        -webkit-print-color-adjust: exact;
      }
      .container {
        max-width: 850px;
        margin: 0 auto;
        background-color: #FFFFFF;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }
      
      /* --- HEADER --- */
      .header {
        background-color: #1A202C;
        color: #FFFFFF;
        padding: 30px 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 6px solid #E53E3E;
      }
      .logo {
        font-size: 32px;
        font-weight: 800;
        letter-spacing: -0.5px;
      }
      .logo span.fly { color: #FFFFFF; }
      .logo span.any { color: #E53E3E; }
      .logo span.trip { color: #FFFFFF; }
      .header-right { text-align: right; }
      .header-title {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 5px 0;
        letter-spacing: 1px;
      }
      .header-subtitle {
        font-size: 13px;
        color: #A0AEC0;
        margin: 0;
      }

      /* --- CONTENT WRAPPER --- */
      .content { padding: 40px; }

      /* --- BOOKING INFO STRIP --- */
      .booking-info-strip {
        display: flex;
        justify-content: space-between;
        background-color: #EDF2F7;
        border-radius: 8px;
        padding: 20px 25px;
        margin-bottom: 35px;
        border-left: 4px solid #3182CE;
      }
      .info-box { flex: 1; }
      .info-label {
        font-size: 12px;
        color: #718096;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
        margin-bottom: 5px;
      }
      .info-value {
        font-size: 18px;
        font-weight: 700;
        color: #1A202C;
        margin: 0;
      }
      .info-value.pnr { color: #3182CE; font-size: 22px; }

      /* --- SECTION TITLES --- */
      .section-header {
        font-size: 16px;
        font-weight: 700;
        color: #2D3748;
        border-bottom: 2px solid #E2E8F0;
        padding-bottom: 10px;
        margin-bottom: 20px;
        margin-top: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
      }
      .section-header::before {
        content: '';
        display: inline-block;
        width: 12px;
        height: 12px;
        background-color: #E53E3E;
        border-radius: 50%;
        margin-right: 10px;
      }

      /* --- FLIGHT ITINERARY --- */
      .itinerary-card {
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        margin-bottom: 35px;
        overflow: hidden;
      }
      .itinerary-header {
        background-color: #F7FAFC;
        padding: 15px 25px;
        border-bottom: 1px solid #E2E8F0;
        display: flex;
        justify-content: space-between;
        font-weight: 600;
        font-size: 14px;
        color: #4A5568;
      }
      .itinerary-body {
        padding: 25px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .flight-endpoint { width: 35%; }
      .flight-endpoint.right { text-align: right; }
      .city-code { font-size: 32px; font-weight: 800; color: #1A202C; line-height: 1; }
      .city-name { font-size: 14px; color: #718096; margin-top: 5px; font-weight: 500; }
      .flight-time { font-size: 16px; font-weight: 600; color: #2D3748; margin-top: 10px; }
      
      .flight-divider {
        width: 25%;
        text-align: center;
        position: relative;
      }
      .flight-duration {
        font-size: 12px;
        color: #718096;
        background: #fff;
        padding: 0 10px;
        position: relative;
        z-index: 1;
        font-weight: 500;
      }
      .flight-line {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 2px;
        background-color: #CBD5E0;
        z-index: 0;
      }
      .flight-line::after {
        content: '✈';
        position: absolute;
        right: -5px;
        top: -12px;
        font-size: 20px;
        color: #A0AEC0;
      }

      /* --- TABLES --- */
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 35px;
      }
      th {
        background-color: #F7FAFC;
        color: #4A5568;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 12px 15px;
        text-align: left;
        border-bottom: 2px solid #E2E8F0;
        border-top: 1px solid #E2E8F0;
      }
      
      /* --- ONE COLUMN LAYOUT (Stacked) --- */
      .stacked-section {
        margin-bottom: 35px;
      }

      /* --- PAYMENT SUMMARY --- */
      .fare-box {
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        overflow: hidden;
        max-width: 500px;
      }
      .fare-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 20px;
        border-bottom: 1px solid #EDF2F7;
        font-size: 14px;
        color: #4A5568;
      }
      .fare-row.total {
        background-color: #2D3748;
        color: #FFFFFF;
        font-weight: 700;
        font-size: 18px;
        border-bottom: none;
        padding: 15px 20px;
      }

      /* --- CUSTOMER DETAILS --- */
      .customer-box {
        background-color: #F7FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 20px;
      }
      .customer-detail {
        margin-bottom: 10px;
        font-size: 14px;
      }
      .customer-detail strong { color: #4A5568; display: inline-block; width: 60px; }

      /* --- TERMS & CONDITIONS --- */
      .terms-section {
        margin-top: 40px;
        padding-top: 30px;
        border-top: 1px dashed #CBD5E0;
      }
      .terms-section h3 {
        font-size: 14px;
        color: #1A202C;
        text-transform: uppercase;
        margin-bottom: 15px;
      }
      .terms-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      .term-block h4 {
        font-size: 13px;
        color: #2D3748;
        margin: 0 0 8px 0;
      }
      .term-block p, .term-block ul {
        font-size: 11px;
        color: #718096;
        line-height: 1.6;
        margin: 0;
        padding-left: 15px;
      }
      .term-block ul { padding-left: 20px; }
      .term-block li { margin-bottom: 4px; }
      
      .footer {
        text-align: center;
        padding: 20px;
        font-size: 12px;
        color: #A0AEC0;
        background-color: #F7FAFC;
        border-top: 1px solid #E2E8F0;
      }
      
      .baggage-badge {
        display: inline-block;
        background: #EBF4FF;
        color: #3182CE;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        margin-right: 10px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      
      <!-- HEADER -->
      <div class="header">
        <div class="logo">
          <span class="fly">FLY</span><span class="any">ANY</span><span class="trip">TRIP</span>
        </div>
        <div class="header-right">
          <h1 class="header-title">E-TICKET / INVOICE</h1>
          <p class="header-subtitle">Thank you for booking with us.</p>
        </div>
      </div>

      <div class="content">
        <!-- BOOKING STRIP -->
        <div class="booking-info-strip">
          <div class="info-box">
            <div class="info-label">Airline PNR</div>
            <div class="info-value pnr">${pnr}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Booking ID</div>
            <div class="info-value">${bookingId}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Booking Date</div>
            <div class="info-value">${bookingDate}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Status</div>
            <div class="info-value" style="color: #48BB78;">${status}</div>
          </div>
        </div>

        <!-- FLIGHT ITINERARY -->
        <h2 class="section-header">Flight Itinerary</h2>
        <div class="itinerary-card">
          <div class="itinerary-header">
            <div>✈ ${airline} | ${flightNumber}</div>
            <div>Class: ${cabinClass}</div>
          </div>
          <div class="itinerary-body">
            <div class="flight-endpoint">
              <div class="city-code">${origin}</div>
              <div class="city-name">Departure Airport</div>
              <div class="flight-time">${departureDate}</div>
            </div>
            
            <div class="flight-divider">
              <div class="flight-line"></div>
              <span class="flight-duration">Non-Stop</span>
            </div>
            
            <div class="flight-endpoint right">
              <div class="city-code">${destination}</div>
              <div class="city-name">Arrival Airport</div>
              <div class="flight-time">${arrivalDate !== 'N/A' ? arrivalDate : departureDate}</div>
            </div>
          </div>
          <div style="padding: 15px 25px; background: #F7FAFC; border-top: 1px solid #E2E8F0; font-size: 12px; color: #718096;">
            <span class="baggage-badge">🎒 Cabin: 7 Kg</span>
            <span class="baggage-badge">🧳 Check-in: 15 Kg</span>
            *Baggage allowance may vary as per airline policies.
          </div>
        </div>

        <!-- STACKED: PASSENGERS, CONTACT, PAYMENT -->
        <div class="stacked-section">
          <h2 class="section-header">Passenger Details</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 30%;">Name & Passport</th>
                <th style="width: 10%;">Gender</th>
                <th style="width: 10%;">DOB</th>
                <th style="width: 15%;">Baggage</th>
                <th style="width: 15%;">Meal</th>
                <th style="width: 15%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${passengerRows}
            </tbody>
          </table>
        </div>

        <div class="stacked-section">
          <h2 class="section-header">Customer & Billing Details</h2>
          <div class="customer-box">
            <div class="customer-detail"><strong>Email:</strong> ${contactEmail}</div>
            <div class="customer-detail"><strong>Phone:</strong> ${contactPhone}</div>
            ${gstNumber !== 'N/A' ? `<div class="customer-detail"><strong>GST No:</strong> ${gstNumber}</div>` : ''}
            ${state !== 'N/A' ? `<div class="customer-detail"><strong>State:</strong> ${state}</div>` : ''}
          </div>
        </div>
        
        <div class="stacked-section">
          <h2 class="section-header">Payment Summary</h2>
          <div class="fare-box">
            <div class="fare-row">
              <span>Base Fare</span>
              <span>₹ ${parseFloat(baseFare).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div class="fare-row">
              <span>Taxes & Airline Fees</span>
              <span>₹ ${parseFloat(taxes).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div class="fare-row">
              <span>Convenience Fee</span>
              <span>₹ 0.00</span>
            </div>
            <div class="fare-row" style="color: #48BB78; font-weight: 600;">
              <span>Discounts</span>
              <span>- ₹ 0.00</span>
            </div>
            <div class="fare-row total">
              <span>Grand Total</span>
              <span>₹ ${parseFloat(totalFare).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

        <!-- TERMS AND CONDITIONS -->
        <div class="terms-section">
          <h3>Terms & Conditions / Cancellation Policy</h3>
          <div class="terms-grid">
            
            <div class="term-block">
              <h4>1. Mandatory Guidelines</h4>
              <ul>
                <li>Passengers must carry a valid photo ID (Aadhaar, Passport, Driving License, or Voter ID) for airport entry and check-in.</li>
                <li>Please reach the airport at least <strong>2 hours prior</strong> to domestic departure and <strong>3 hours prior</strong> for international flights.</li>
                <li>Boarding gates close 45 minutes prior to the scheduled departure time.</li>
              </ul>
            </div>

            <div class="term-block">
              <h4>2. Cancellation & Refunds</h4>
              <ul>
                <li>All cancellations must be made at least 4 hours before flight departure.</li>
                <li>Airline cancellation charges apply as per the fare rules associated with your ticket.</li>
                <li>FlyAnyTrip charges a flat convenience fee of ₹300 per passenger per sector for any cancellations.</li>
                <li>Refunds will be processed to the original payment method within 5-7 business days.</li>
              </ul>
            </div>

            <div class="term-block">
              <h4>3. Rescheduling Details</h4>
              <ul>
                <li>Date change requests are subject to airline date change fees + fare difference (if any).</li>
                <li>FlyAnyTrip rescheduling service fee of ₹250 per passenger applies.</li>
              </ul>
            </div>

            <div class="term-block">
              <h4>4. Baggage & Web Check-in</h4>
              <ul>
                <li>Web check-in is mandatory for most domestic flights in India. Please complete it on the airline's website.</li>
                <li>Excess baggage can be pre-purchased online at discounted rates to avoid high airport charges.</li>
              </ul>
            </div>

          </div>
        </div>

      </div> <!-- end content -->
      
      <div class="footer">
        FlyAnyTrip Travel Solutions Pvt. Ltd. | Support: support@flyanytrip.com | Helpdesk: +91-800-123-4567<br>
        This is an electronically generated invoice and does not require a physical signature.
      </div>
    </div>
  </body>
  </html>
  `;
};

module.exports = { getInvoiceHTML };
