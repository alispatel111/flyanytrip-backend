const axios = require('axios');

/**
 * Adivaha API Integration Service
 * Base configuration and methods for interacting with Adivaha Flights API.
 */

const ADIVAHA_BASE_URL = 'https://api.adivaha.io/flights/api/';
const PID = process.env.ADIVAHA_PID;
const API_KEY = process.env.ADIVAHA_API_KEY;

const adivahaClient = axios.create({
  baseURL: ADIVAHA_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip',
    'PID': PID,
    'x-api-key': API_KEY
  }
});

class AdivahaFlightService {
  /**
   * Search for flight locations (Airports/Cities)
   * GET https://api.adivaha.io/flights/api/?action=flightLocations&term={term}&limit={limit}
   * @param {string} term - The search query (e.g., 'del' for Delhi)
   * @param {number} limit - Number of results to return
   */
  static async searchLocations(term, limit = 5) {
    try {
      const response = await adivahaClient.get('/', {
        params: {
          action: 'flightLocations',
          term,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Adivaha searchLocations Error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async searchFlights(searchPayload) {
    try {
      const {
        origin,
        destination,
        departureDate,
        returnDate,
        adults = "1",
        children = "0",
        infants = "0",
        tripType = "oneway"
      } = searchPayload;

      // Ensure dates are correctly formatted as YYYY-MM-DD
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toISOString().split('T')[0];
      };

      const categoryMap = {
        'Economy': 'Economy',
        'Premium Economy': 'PremiumEconomy',
        'Business': 'Business',
        'First Class': 'First'
      };

      const payload = {
        action: "flightSearch",
        adults: String(adults),
        children: String(children),
        infants: String(infants),
        isoneway: tripType === 'oneway' || tripType === 'one' ? "Yes" : "No",
        From_IATACODE: origin,
        To_IATACODE: destination,
        departure_date: formatDate(departureDate),
        return_date: tripType === 'round' && returnDate ? formatDate(returnDate) : "",
        Flights_category: categoryMap[searchPayload.cabinClass] || "Economy"
      };

      const response = await adivahaClient.post('/?action=searchFlights', payload);
      
      // We normalize the adivaha flights data format to the one expected by our frontend ResultsSection
      // The frontend expects: { id, type: 'flight', airline, flight, from, to, time, arrival, dur, price, class }
      
      const resultsArray = response.data?.responseData?.Response?.Results?.[0];

      if (resultsArray && resultsArray.length > 0) {
        const mappedFlights = resultsArray.map((f, index) => {
          // A flight might have multiple segments, we take the first one for basic display
          const firstSegment = f.Segments?.[0]?.[0];
          // We take the last segment for arrival info
          const lastSegment = f.Segments?.[0]?.[f.Segments[0].length - 1]; 
          
          if (!firstSegment) return null;

          // Format time helper (from "2026-05-01T10:00:00" to "10:00 AM")
          const formatTime = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          };

          // Format duration helper (minutes to Xh Ym)
          const formatDuration = (mins) => {
            if (!mins) return '0h';
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            return `${h}h ${m}m`;
          };

          return {
            id: f.ResultIndex || `adivaha_${index}`,
            type: 'flight',
            airline: firstSegment.Airline?.AirlineName || 'Airlines',
            flight: `${firstSegment.Airline?.AirlineCode}-${firstSegment.Airline?.FlightNumber}`,
            from: firstSegment.Origin?.Airport?.AirportCode || origin,
            to: lastSegment?.Destination?.Airport?.AirportCode || destination,
            time: formatTime(firstSegment.Origin?.DepTime),
            arrival: formatTime(lastSegment?.Destination?.ArrTime),
            dur: formatDuration(firstSegment.Duration),
            price: Math.round(f.Fare?.OfferedFare || f.Fare?.PublishedFare || 0).toLocaleString(),
            class: firstSegment.FareClassification?.Type || searchPayload.cabinClass || 'Economy',
            raw: f // keep original for debug
          };
        }).filter(Boolean);

        return { flights: mappedFlights, rawAdivahaResponse: response.data };
      }

      return { flights: [], rawAdivahaResponse: response.data };
    } catch (error) {
      console.error('Adivaha searchFlights Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // TODO: Implement Flight Fare Quote (POST)
  static async getFlightFareQuote(quotePayload) {
    // Implement Flight Fare Quote endpoint
  }

  /**
   * Get lowest airfare of the month
   * POST https://api.adivaha.io/flights/api/?action=GetCalendarFare
   */
  static async getCalendarFare(payload) {
    try {
      const {
        origin,
        destination,
        departureDate,
        cabinClass = "Economy"
      } = payload;

      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toISOString().split('T')[0];
      };

      const categoryMap = {
        'Economy': 'Economy',
        'Premium Economy': 'PremiumEconomy',
        'Business': 'Business',
        'First Class': 'First'
      };

      const apiPayload = {
        action: "GetCalendarFare",
        From_IATACODE: origin,
        To_IATACODE: destination,
        departure_date: formatDate(departureDate),
        flights_category: categoryMap[cabinClass] || "Economy"
      };

      const response = await adivahaClient.post(`/?action=GetCalendarFare`, apiPayload);
      return response.data;
    } catch (error) {
      console.error('Adivaha getCalendarFare Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // TODO: Implement LCC/Non-LCC Flight Book (POST)
  static async bookFlight(bookingPayload) {
    // Implement Booking endpoint
  }
}

module.exports = AdivahaFlightService;
