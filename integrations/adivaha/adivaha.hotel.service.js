const axios = require('axios');

/**
 * Adivaha Hotel Booking API Integration Service
 * Base URL: https://api.adivaha.io/hotel-booking/api/
 * All requests require PID and x-api-key headers (same credentials as flights).
 */

const ADIVAHA_HOTEL_BASE_URL = 'https://api.adivaha.io/hotel-booking/api/';
const PID = process.env.ADIVAHA_PID;
const API_KEY = process.env.ADIVAHA_API_KEY;

const hotelClient = axios.create({
  baseURL: ADIVAHA_HOTEL_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip',
    'Content-Type': 'application/json',
    PID: PID,
    'x-api-key': API_KEY,
  },
  timeout: 30000, // 30s — hotel searches can be slow
});

class AdivahaHotelService {
  /**
   * Step 1 — Get Locations (Autocomplete)
   * GET ?action=getLocations&term={term}&limit={limit}
   */
  static async getLocations(term, limit = 10) {
    try {
      const response = await hotelClient.get('/', {
        params: { action: 'getLocations', term, limit },
      });
      return response.data; // { cities: [...] }
    } catch (error) {
      console.error('Hotel getLocations Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Step 2 — Hotel Search
   * POST ?action=hotelSearch
   * Body: { action, regionid, countryCode, checkIn, checkOut, rooms, adults, children, childAge, page }
   */
  static async hotelSearch(payload) {
    try {
      const {
        regionid,
        countryCode,
        checkIn,
        checkOut,
        rooms = 1,
        adults = '1',
        children = '0',
        childAge = '0',
        page = 1,
      } = payload;

      const body = {
        action: 'hotelSearch',
        regionid,
        countryCode,
        checkIn,
        checkOut,
        rooms,
        adults,
        children,
        childAge,
        page,
      };

      const response = await hotelClient.post('/?action=hotelSearch', body);

      // ── PRICE DEBUG LOG ──────────────────────────────────────────────
      // This logs the raw pricing fields from the first hotel returned by
      // the Adivaha API so we can verify the correct currency and field names.
      try {
        const firstHotel = response.data?.responseData?.HotelLists?.HotelList?.[0];
        if (firstHotel) {
          const pricingDebug = {
            hotelName: firstHotel.Name,
            LowRate: firstHotel.LowRate,
            HighRate: firstHotel.HighRate,
            Currency: firstHotel.Currency,
            currency: firstHotel.currency,
            // Check all keys on the hotel object that might be price-related
            allKeys: Object.keys(firstHotel),
            // Top-level response currency fields
            responseCurrency: response.data?.responseData?.currency,
            responseCurrencyUpper: response.data?.responseData?.Currency,
            // Full pricing snapshot of the first hotel
            fullFirstHotel: JSON.stringify(firstHotel).substring(0, 2000),
          };
          console.log('\n======= ADIVAHA HOTEL PRICE DEBUG =======');
          console.log(JSON.stringify(pricingDebug, null, 2));
          console.log('=========================================\n');
        }
      } catch (debugErr) {
        console.warn('Price debug logging failed:', debugErr.message);
      }
      // ── END PRICE DEBUG ──────────────────────────────────────────────

      return response.data;
    } catch (error) {
      console.error('Hotel hotelSearch Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Step 3 — Hotel Details By Code
   * POST ?action=hotelDetailsBycode
   * Body: { action, hotelId }
   */
  static async hotelDetailsByCode(hotelId) {
    try {
      const response = await hotelClient.post('/?action=hotelDetailsBycode', {
        action: 'hotelDetailsBycode',
        hotelId: String(hotelId),
      });
      return response.data;
    } catch (error) {
      console.error('Hotel hotelDetailsByCode Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Step 4 — Room Availability
   * POST ?action=roomAvalibility
   * Body: { action, hotelId, checkIn, checkOut, rooms, adults, children, childAge }
   */
  static async roomAvailability(payload) {
    try {
      const {
        hotelId,
        checkIn,
        checkOut,
        rooms = '1',
        adults = '1',
        children = '0',
        childAge = '0',
      } = payload;

      const response = await hotelClient.post('/?action=roomAvalibility', {
        action: 'roomAvalibility',
        hotelId: String(hotelId),
        checkIn,
        checkOut,
        rooms: String(rooms),
        adults: String(adults),
        children: String(children),
        childAge: String(childAge),
      });
      return response.data;
    } catch (error) {
      console.error('Hotel roomAvailability Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Step 5 — Check Rates (Verify price before booking)
   * POST ?action=CheckRates
   * Body: { action, rateKey }
   */
  static async checkRates(rateKey) {
    try {
      const response = await hotelClient.post('/?action=CheckRates', {
        action: 'CheckRates',
        rateKey,
      });
      return response.data;
    } catch (error) {
      console.error('Hotel checkRates Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Step 6 — Book Hotel
   * POST ?action=bookHotel
   * Body: { action, holder, rooms[{rateKey, paxes}], isTolerance, chargablePrice, currency }
   */
  static async bookHotel(payload) {
    try {
      const { holder, rooms, isTolerance = 'Yes', chargablePrice, currency = 'INR' } = payload;

      const response = await hotelClient.post('/?action=bookHotel', {
        action: 'bookHotel',
        holder,
        rooms,
        isTolerance,
        chargablePrice,
        currency,
      });
      return response.data;
    } catch (error) {
      console.error('Hotel bookHotel Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Step 7 — Booking Detail
   * POST ?action=bookingDetail
   * Body: { action, booking_reference, order_id }
   */
  static async bookingDetail(bookingReference, orderId) {
    try {
      const response = await hotelClient.post('/?action=bookingDetail', {
        action: 'bookingDetail',
        booking_reference: bookingReference,
        order_id: orderId,
      });
      return response.data;
    } catch (error) {
      console.error('Hotel bookingDetail Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Step 8 — Cancel Booking
   * POST ?action=cancelBooking
   * Body: { action, order_id, booking_reference, reason }
   */
  static async cancelBooking(orderId, bookingReference, reason = 'others') {
    try {
      const response = await hotelClient.post('/?action=cancelBooking', {
        action: 'cancelBooking',
        order_id: String(orderId),
        booking_reference: bookingReference,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error('Hotel cancelBooking Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = AdivahaHotelService;
