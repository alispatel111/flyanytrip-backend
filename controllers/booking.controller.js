const adivahaService = require('../integrations/adivaha/adivaha.service');
const { query } = require('../config/db');
const shortid = require('shortid');

/**
 * Revalidate flight before final payment
 * POST /api/booking/revalidate
 */
const revalidateBooking = async (req, res, next) => {
  try {
    const { traceId, resultIndex, tokenId } = req.body;
    
    if (!traceId || !resultIndex) {
      return res.status(400).json({ success: false, message: 'Missing traceId or resultIndex' });
    }

    const endUserIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    const quote = await adivahaService.getFlightFareQuote({ 
      TraceId: traceId, 
      ResultIndex: resultIndex,
      TokenId: tokenId,
      EndUserIp: endUserIp
    });

    return res.status(200).json({
      success: true,
      data: quote
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm booking after successful payment
 * POST /api/booking/confirm
 */
const confirmBooking = async (req, res, next) => {
  try {
    const { 
      isLCC, 
      traceId, 
      resultIndex, 
      passengers, 
      contactDetails,
      paymentData, // Contains razorpay_order_id, razorpay_payment_id, razorpay_signature
      flightSnapshot,
      totalAmount
    } = req.body;

    if (!paymentData || !paymentData.razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Payment reference missing' });
    }

    // 1. Call Adivaha Booking API
    const bookingResponse = await adivahaService.bookFlight({
      isLCC,
      TraceId: traceId,
      ResultIndex: resultIndex,
      Passengers: passengers,
      ContactDetails: contactDetails
    });

    const responseData = bookingResponse?.responseData?.Response || bookingResponse?.Response || {};
    
    if (responseData.Error && responseData.Error.ErrorCode !== 0) {
      return res.status(400).json({
        success: false,
        message: responseData.Error.ErrorMessage || 'Booking failed at airline side',
        error: responseData.Error
      });
    }

    // 2. Save to Database
    const internalBookingId = 'FAT' + shortid.generate().toUpperCase();
    const pnr = responseData.PNR;

    try {
      // Start Database Transaction
      await query('BEGIN');

      // Insert Booking
      await query(
        `INSERT INTO bookings (booking_id, pnr, trace_id, result_index, total_amount, status, contact_email, contact_mobile, flight_data) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          internalBookingId, 
          pnr, 
          traceId, 
          resultIndex, 
          totalAmount, 
          'CONFIRMED', 
          contactDetails.Email, 
          contactDetails.ContactNo, 
          JSON.stringify(flightSnapshot)
        ]
      );

      // Insert Travellers
      for (const p of passengers) {
        await query(
          `INSERT INTO booking_travellers (booking_id, first_name, last_name, gender, dob, passenger_type, passport_number, passport_expiry) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            internalBookingId,
            p.FirstName,
            p.LastName,
            p.Gender === 1 ? 'Male' : 'Female',
            p.DateOfBirth,
            p.PaxType === 1 ? 'ADULT' : p.PaxType === 2 ? 'CHILD' : 'INFANT',
            p.PassportNo || null,
            p.PassportExpiry || null
          ]
        );
      }

      // Insert Payment Record
      await query(
        `INSERT INTO booking_payments (booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          internalBookingId,
          paymentData.razorpay_order_id,
          paymentData.razorpay_payment_id,
          paymentData.razorpay_signature,
          totalAmount,
          'SUCCESS'
        ]
      );

      await query('COMMIT');
    } catch (dbError) {
      await query('ROLLBACK');
      console.error('Database Error during booking save:', dbError);
      // Even if DB fails, we have the PNR from airline, but we should log it heavily.
    }

    return res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: {
        pnr: pnr,
        bookingId: internalBookingId,
        status: responseData.TicketStatus || 'Confirmed',
        itinerary: responseData.FlightItinerary,
        fare: responseData.Fare,
        passengers: passengers
      }
    });
  } catch (error) {
    console.error('Confirm Booking Error:', error);
    next(error);
  }
};

/**
 * Get booking details by ID
 * GET /api/booking/details/:id
 */
const getBookingDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT b.*, 
       (SELECT json_agg(t.*) FROM booking_travellers t WHERE t.booking_id = b.booking_id) as travellers,
       (SELECT json_agg(p.*) FROM booking_payments p WHERE p.booking_id = b.booking_id) as payments
       FROM bookings b 
       WHERE b.booking_id = $1 OR b.pnr = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  revalidateBooking,
  confirmBooking,
  getBookingDetails
};
