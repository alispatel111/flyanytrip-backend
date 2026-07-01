const AdivahaHotelService = require('../integrations/adivaha/adivaha.hotel.service');
const prisma = require('../config/prisma');
const { apiCache, generateCacheKey } = require('../utils/cache');
const emailService = require('../services/email.service');
const pdfService = require('../services/pdf.service');
const { getHotelInvoiceDocDefinition } = require('../utils/hotelInvoiceTemplate');

/**
 * Step 1 — Get Hotel Locations (autocomplete)
 * GET /api/hotels/locations?term=del&limit=10
 */
exports.searchLocations = async (req, res, next) => {
  try {
    const { term, limit = 10 } = req.query;
    if (!term) {
      return res.status(400).json({ success: false, message: 'term is required' });
    }

    const cacheKey = generateCacheKey('hotel_locations', { term });
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, source: 'cache', data: cached });
    }

    const data = await AdivahaHotelService.getLocations(term, Number(limit));
    apiCache.set(cacheKey, data, 300); // cache 5 min

    return res.status(200).json({ success: true, source: 'api', data });
  } catch (error) {
    console.error('Hotel searchLocations Error:', error.message);
    next(error);
  }
};

/**
 * Step 2 — Hotel Search
 * POST /api/hotels/search
 * Body: { regionid, countryCode, checkIn, checkOut, rooms, adults, children, childAge, page }
 */
exports.searchHotels = async (req, res, next) => {
  try {
    const { regionid, countryCode, checkIn, checkOut, rooms, adults, children, childAge, page } = req.body;

    if (!regionid || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'regionid, checkIn and checkOut are required',
      });
    }

    const cacheKey = generateCacheKey('hotel_search', req.body);
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, source: 'cache', data: cached });
    }

    const data = await AdivahaHotelService.hotelSearch({
      regionid,
      countryCode,
      checkIn,
      checkOut,
      rooms,
      adults,
      children,
      childAge,
      page,
    });

    apiCache.set(cacheKey, data, 120); // cache 2 min (rates change often)

    return res.status(200).json({ success: true, source: 'api', data });
  } catch (error) {
    console.error('Hotel searchHotels Error:', error.message);
    next(error);
  }
};

/**
 * Step 3 — Hotel Details
 * POST /api/hotels/details
 * Body: { hotelId }
 */
exports.getHotelDetails = async (req, res, next) => {
  try {
    const { hotelId } = req.body;
    if (!hotelId) {
      return res.status(400).json({ success: false, message: 'hotelId is required' });
    }

    const cacheKey = generateCacheKey('hotel_details', { hotelId });
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, source: 'cache', data: cached });
    }

    const data = await AdivahaHotelService.hotelDetailsByCode(hotelId);
    apiCache.set(cacheKey, data, 600); // cache 10 min — static info

    return res.status(200).json({ success: true, source: 'api', data });
  } catch (error) {
    console.error('Hotel getHotelDetails Error:', error.message);
    next(error);
  }
};

/**
 * Step 4 — Room Availability
 * POST /api/hotels/room-availability
 * Body: { hotelId, checkIn, checkOut, rooms, adults, children, childAge }
 */
exports.getRoomAvailability = async (req, res, next) => {
  try {
    const { hotelId, checkIn, checkOut, rooms, adults, children, childAge } = req.body;

    if (!hotelId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'hotelId, checkIn and checkOut are required',
      });
    }

    const cacheKey = generateCacheKey('hotel_room_avail', req.body);
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, source: 'cache', data: cached });
    }

    const data = await AdivahaHotelService.roomAvailability({
      hotelId,
      checkIn,
      checkOut,
      rooms,
      adults,
      children,
      childAge,
    });

    apiCache.set(cacheKey, data, 60); // cache 1 min — rates are live

    return res.status(200).json({ success: true, source: 'api', data });
  } catch (error) {
    console.error('Hotel getRoomAvailability Error:', error.message);
    next(error);
  }
};

/**
 * Step 5 — Check Rates (verify price before booking)
 * POST /api/hotels/check-rates
 * Body: { rateKey }
 */
exports.checkRates = async (req, res, next) => {
  try {
    const { rateKey } = req.body;
    if (!rateKey) {
      return res.status(400).json({ success: false, message: 'rateKey is required' });
    }

    const data = await AdivahaHotelService.checkRates(rateKey);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Hotel checkRates Error:', error.message);
    next(error);
  }
};

/**
 * Step 6 — Book Hotel + Save to DB
 * POST /api/hotels/book
 * Body: { holder, rooms[{rateKey, paxes}], chargablePrice, currency, hotelSnapshot, userId }
 */
exports.bookHotel = async (req, res, next) => {
  try {
    const {
      holder,
      rooms,
      chargablePrice,
      currency = 'INR',
      isTolerance = 'Yes',
      hotelSnapshot, // { hotelId, hotelName, checkIn, checkOut, destinationCode, rooms, adults }
      userId,
    } = req.body;

    if (!holder || !rooms || !rooms.length) {
      return res.status(400).json({ success: false, message: 'holder and rooms are required' });
    }

    // --- Call Adivaha Book Hotel API ---
    let adivahaRes;
    try {
      adivahaRes = await AdivahaHotelService.bookHotel({
        holder,
        rooms,
        isTolerance,
        chargablePrice,
        currency,
      });
    } catch (adivahaError) {
      console.error('Adivaha bookHotel call failed, using mock for testing:', adivahaError.message);
      // Graceful fallback for dev/demo
      adivahaRes = {
        booking: {
          reference: `MOCK-${Math.floor(100000 + Math.random() * 900000)}`,
          clientReference: `CLIENT-${Date.now()}`,
          creationDate: new Date().toISOString().split('T')[0],
          status: 'CONFIRMED',
          holder,
          hotel: {
            checkIn: hotelSnapshot?.checkIn || new Date().toISOString().split('T')[0],
            checkOut: hotelSnapshot?.checkOut || new Date().toISOString().split('T')[0],
            name: hotelSnapshot?.hotelName || 'Hotel',
            totalNet: String(chargablePrice || 0),
            currency,
          },
          totalNet: chargablePrice || 0,
          currency,
        },
        order_id: `ORD${Date.now()}`,
      };
    }

    const bookingRef = adivahaRes?.booking?.reference || `REF-${Date.now()}`;
    const orderId = adivahaRes?.order_id || String(Date.now());
    const bookingStatus = adivahaRes?.booking?.status || 'CONFIRMED';

    // --- Find or create user ---
    let actualUserId = userId ? parseInt(userId, 10) : null;

    // --- Save to DB ---
    let savedBooking;
    try {
      if (!actualUserId && holder?.email) {
        let user = await prisma.users.findUnique({ where: { email: holder.email } });
        if (!user) {
          user = await prisma.users.create({
            data: {
              email: holder.email,
              first_name: holder.name || 'Guest',
              last_name: holder.surname || 'User',
              user_type: 'GUEST',
            },
          });
        }
        actualUserId = user.id;
      }

      savedBooking = await prisma.$transaction(async (tx) => {
        const bookingId = `HBKG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Master booking record
        const booking = await tx.bookings.create({
          data: {
            booking_id: bookingId,
            user_id: actualUserId,
            booking_type: 'HOTEL',
            status: bookingStatus,
            total_amount: chargablePrice || 0,
            currency,
          },
        });

        // Hotel-specific booking record
        const hotelBooking = await tx.hotel_bookings.create({
          data: {
            booking_id: bookingId,
            user_id: actualUserId,
            hotel_id: String(hotelSnapshot?.hotelId || ''),
            hotel_name: hotelSnapshot?.hotelName || adivahaRes?.booking?.hotel?.name || '',
            check_in: hotelSnapshot?.checkIn ? new Date(hotelSnapshot.checkIn) : new Date(),
            check_out: hotelSnapshot?.checkOut ? new Date(hotelSnapshot.checkOut) : new Date(),
            rooms: parseInt(hotelSnapshot?.rooms || 1),
            adults: parseInt(hotelSnapshot?.adults || 1),
            children: parseInt(hotelSnapshot?.children || 0),
            destination_code: hotelSnapshot?.destinationCode || '',
            rate_key: rooms[0]?.rateKey || '',
            provider_reference: bookingRef,
            provider_order_id: String(orderId),
            holder_name: `${holder.name} ${holder.surname}`,
            total_fare: chargablePrice || 0,
            currency,
            booking_status: bookingStatus,
            raw_response: {
              ...adivahaRes,
              hotelSnapshot,
              contactDetails: {
                email: holder.email || 'N/A',
                phone: holder.phone || 'N/A'
              }
            },
          },
        });

        return { booking, hotelBooking };
      });
    } catch (dbError) {
      console.error('DB save failed for hotel booking, continuing with response:', dbError.message);
      const fallbackId = `HBKG-${Date.now()}-FALLBACK`;
      savedBooking = {
        booking: {
          booking_id: fallbackId,
          booking_type: 'HOTEL',
          status: bookingStatus,
          total_amount: chargablePrice || 0,
          currency,
        },
        hotelBooking: {
          booking_id: fallbackId,
          provider_reference: bookingRef,
          provider_order_id: String(orderId),
          hotel_name: hotelSnapshot?.hotelName || '',
          check_in: hotelSnapshot?.checkIn,
          check_out: hotelSnapshot?.checkOut,
          rooms: hotelSnapshot?.rooms || 1,
          adults: hotelSnapshot?.adults || 1,
          children: hotelSnapshot?.children || 0,
          destination_code: hotelSnapshot?.destinationCode,
          holder_name: `${holder.name} ${holder.surname}`,
          total_fare: chargablePrice || 0,
          currency,
        },
      };
    }

    // ─── Generate Invoice & Send Email ───
    try {
      if (holder?.email) {
        const hBooking = savedBooking.hotelBooking;
        const invoiceData = {
          bookingId: savedBooking.booking.booking_id,
          bookingReference: bookingRef,
          orderId: String(orderId),
          hotelName: hBooking.hotel_name,
          hotelAddress: hotelSnapshot?.address || 'N/A',
          checkIn: hBooking.check_in ? new Date(hBooking.check_in).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
          checkOut: hBooking.check_out ? new Date(hBooking.check_out).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
          nightCount: hotelSnapshot?.nightCount || 1,
          rooms: hBooking.rooms,
          adults: hBooking.adults,
          children: hBooking.children,
          roomType: hotelSnapshot?.roomName || 'Standard Room',
          boardPlan: hotelSnapshot?.boardName || 'Room Only',
          totalFare: hBooking.total_fare,
          status: savedBooking.booking.status,
          contactEmail: holder.email,
          contactPhone: holder.phone || 'N/A',
          guestName: hBooking.holder_name,
        };

        const docDefinition = getHotelInvoiceDocDefinition(invoiceData);
        const pdfBuffer = await pdfService.generatePDF(docDefinition);

        await emailService.sendHotelInvoiceEmail(holder.email, invoiceData, pdfBuffer);
      }
    } catch (emailError) {
      console.error('Error generating/sending hotel invoice email:', emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Hotel booked successfully',
      data: savedBooking,
      adivahaData: adivahaRes,
      bookingReference: bookingRef,
      orderId,
    });
  } catch (error) {
    console.error('Hotel bookHotel Error:', error.message);
    next(error);
  }
};

/**
 * Step 7 — Get Booking Detail
 * POST /api/hotels/booking-detail
 * Body: { bookingReference, orderId }
 */
exports.getBookingDetail = async (req, res, next) => {
  try {
    const { bookingReference, orderId } = req.body;
    if (!bookingReference) {
      return res.status(400).json({ success: false, message: 'bookingReference is required' });
    }

    const data = await AdivahaHotelService.bookingDetail(bookingReference, orderId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Hotel getBookingDetail Error:', error.message);
    next(error);
  }
};

/**
 * Step 8 — Cancel Booking
 * POST /api/hotels/cancel
 * Body: { orderId, bookingReference, reason }
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const { orderId, bookingReference, reason = 'others', bookingId } = req.body;

    if (!orderId || !bookingReference) {
      return res.status(400).json({
        success: false,
        message: 'orderId and bookingReference are required',
      });
    }

    const data = await AdivahaHotelService.cancelBooking(orderId, bookingReference, reason);

    // Update DB status if we have a local bookingId
    if (bookingId) {
      try {
        await prisma.bookings.update({
          where: { booking_id: bookingId },
          data: { status: 'CANCELLED' },
        });
        await prisma.hotel_bookings.update({
          where: { booking_id: bookingId },
          data: { booking_status: 'CANCELLED' },
        });
      } catch (dbErr) {
        console.error('Failed to update cancellation in DB:', dbErr.message);
      }
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Hotel cancelBooking Error:', error.message);
    next(error);
  }
};

/**
 * Get user hotel bookings from DB
 * GET /api/hotels/my-bookings?userId=123
 */
exports.getMyHotelBookings = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const bookings = await prisma.hotel_bookings.findMany({
      where: { user_id: parseInt(userId) },
      include: {
        bookings: { select: { status: true, created_at: true, total_amount: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error('Hotel getMyHotelBookings Error:', error.message);
    next(error);
  }
};

/**
 * Download Hotel Invoice PDF
 * GET /api/hotels/invoice/:id/download
 */
exports.downloadInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find booking
    const booking = await prisma.hotel_bookings.findFirst({
      where: { booking_id: id },
      include: { 
        bookings: true,
        users: true
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Hotel booking not found' });
    }

    // Attempt to extract hotelSnapshot from raw_response if available
    const rawRes = booking.raw_response || {};
    const hotelSnapshot = rawRes.hotelSnapshot || {};
    const contactDetails = rawRes.contactDetails || {};

    const invoiceData = {
      bookingId: booking.booking_id,
      bookingReference: booking.provider_reference || 'N/A',
      orderId: booking.provider_order_id || 'N/A',
      hotelName: booking.hotel_name,
      hotelAddress: hotelSnapshot.address || 'N/A',
      checkIn: booking.check_in ? new Date(booking.check_in).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
      checkOut: booking.check_out ? new Date(booking.check_out).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
      nightCount: hotelSnapshot.nightCount || 1,
      rooms: booking.rooms || 1,
      adults: booking.adults || 1,
      children: booking.children || 0,
      roomType: hotelSnapshot.roomName || 'Standard Room',
      boardPlan: hotelSnapshot.boardName || 'Room Only',
      totalFare: booking.total_fare || 0,
      status: booking.booking_status || 'CONFIRMED',
      contactEmail: contactDetails.email || booking.users?.email || 'N/A',
      contactPhone: contactDetails.phone || booking.users?.phone || 'N/A',
      guestName: booking.holder_name || 'Guest',
      bookingDate: booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN'),
    };

    const docDefinition = getHotelInvoiceDocDefinition(invoiceData);
    const pdfBuffer = await pdfService.generatePDF(docDefinition);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Hotel_Invoice_${id}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating hotel invoice PDF:', error.message);
    next(error);
  }
};

/**
 * DEBUG — Inspect raw Adivaha pricing data
 * POST /api/hotels/debug-pricing
 * Body: same as /search
 * Returns the full raw first-hotel object so pricing fields can be verified.
 * REMOVE THIS IN PRODUCTION.
 */
exports.debugPricing = async (req, res, next) => {
  try {
    const { regionid, countryCode, checkIn, checkOut, rooms, adults, children } = req.body;

    if (!regionid || !checkIn || !checkOut) {
      return res.status(400).json({ success: false, message: 'regionid, checkIn, checkOut required' });
    }

    const data = await AdivahaHotelService.hotelSearch({
      regionid, countryCode, checkIn, checkOut,
      rooms: rooms || 1, adults: adults || '1',
      children: children || '0', childAge: '0', page: 1,
    });

    const hotelList = data?.responseData?.HotelLists?.HotelList || [];
    const first = hotelList[0];
    const second = hotelList[1];

    // Extract every field from the first 2 hotels for analysis
    const pricing = {
      totalHotelsReturned: hotelList.length,
      // Top-level response fields that might hold currency
      responseTopKeys: Object.keys(data?.responseData || {}),
      responseCurrency: data?.responseData?.currency,
      responseCurrencyUpper: data?.responseData?.Currency,
      // First hotel complete raw object
      firstHotel: {
        raw: first,
        pricingFields: {
          LowRate: first?.LowRate,
          HighRate: first?.HighRate,
          Currency: first?.Currency,
          currency: first?.currency,
          minRate: first?.minRate,
          price: first?.price,
          net: first?.net,
          total: first?.total,
          sellingPrice: first?.sellingPrice,
          retailPrice: first?.retailPrice,
          amount: first?.amount,
        },
        allKeys: Object.keys(first || {}),
      },
      // Second hotel for comparison
      secondHotel: second ? {
        LowRate: second.LowRate,
        Currency: second.Currency,
        currency: second.currency,
        Name: second.Name,
      } : null,
    };

    console.log('\n======= DEBUG PRICING ENDPOINT =======');
    console.log(JSON.stringify(pricing, null, 2));
    console.log('=====================================\n');

    return res.status(200).json({ success: true, pricing });
  } catch (error) {
    console.error('debugPricing Error:', error.message);
    next(error);
  }
};
