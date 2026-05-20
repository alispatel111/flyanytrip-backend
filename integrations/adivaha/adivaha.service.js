const axios = require('axios');

/**
 * Adivaha API Integration Service
 * Base configuration and methods for interacting with Adivaha Flights API.
 */

const ADIVAHA_BASE_URL = 'https://api.adivaha.io/flights/api';
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

// Interceptor to handle Adivaha internal Token Management
adivahaClient.interceptors.response.use(
  async (response) => {
    const errorObj = response.data?.responseData?.Response?.Error || 
                     response.data?.Response?.Error || 
                     response.data?.Error;

    // ErrorCode 6 means 'Invalid Token'
    if (errorObj && errorObj.ErrorCode === 6) {
      const originalRequest = response.config;
      
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          console.log('Adivaha Token Invalid (ErrorCode 6). Generating fresh token...');
          // Call createToken to refresh the internal token state at Adivaha
          await axios.get(`${ADIVAHA_BASE_URL}/?action=createToken`, {
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip',
              'PID': PID,
              'x-api-key': API_KEY
            }
          });
          
          console.log('Token refreshed successfully. Retrying original request...');
          // Retry the original request
          return adivahaClient(originalRequest);
        } catch (refreshError) {
          console.error('Failed to refresh Adivaha token:', refreshError.message);
          return Promise.reject(refreshError);
        }
      }
    }

    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

      const response = await adivahaClient.post('/', payload);

      // We normalize the adivaha flights data format to the one expected by our frontend ResultsSection
      // The frontend expects: { id, type: 'flight', airline, flight, from, to, time, arrival, dur, price, class }

      let resultsArray = response.data?.responseData?.Response?.Results ||
        response.data?.Response?.Results ||
        response.data?.Results;

      const traceId = response.data?.responseData?.Response?.TraceId ||
        response.data?.Response?.TraceId ||
        response.data?.TraceId;

      const tokenId = response.data?.responseData?.Response?.TokenId ||
        response.data?.Response?.TokenId ||
        response.data?.TokenId;

      if (resultsArray && resultsArray.length > 0) {
        // Adivaha often nests results: [[flight1, flight2, ...]]
        // We flatten it if necessary
        if (Array.isArray(resultsArray[0])) {
          resultsArray = resultsArray[0];
        }

        const mappedFlights = resultsArray.map((f, index) => {
          // ... (rest of mapping logic)
          // (Keeping lines 106-174 same)
          const firstSegment = f.Segments?.[0]?.[0];
          const lastSegment = f.Segments?.[0]?.[f.Segments[0].length - 1];
          if (!firstSegment) return null;
          const formatTime = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          };
          const formatDuration = (mins) => {
            if (!mins || isNaN(mins)) return '0m';
            const h = Math.floor(mins / 60);
            const m = Math.floor(mins % 60);
            if (h > 0 && m > 0) return `${h}h ${m}m`;
            if (h > 0) return `${h}h`;
            return `${m}m`;
          };
          const segments = f.Segments?.[0] || [];
          const numStops = segments.length > 0 ? segments.length - 1 : 0;
          let totalDurationMins = 0;
          let layoverStr = "";
          if (segments.length === 1) {
            totalDurationMins = segments[0].AccumulatedDuration || segments[0].Duration || 0;
          } else if (segments.length > 1) {
            let calculatedTotal = 0;
            let layoverDetails = [];
            for (let i = 0; i < segments.length; i++) {
              calculatedTotal += (segments[i].Duration || 0);
              if (i < segments.length - 1) {
                const currentSeg = segments[i];
                const nextSeg = segments[i + 1];
                const arrTime = new Date(currentSeg.Destination.ArrTime);
                const depTime = new Date(nextSeg.Origin.DepTime);
                let layoverMins = 0;
                if (!isNaN(arrTime.getTime()) && !isNaN(depTime.getTime())) {
                  layoverMins = Math.floor((depTime - arrTime) / (1000 * 60));
                  if (layoverMins < 0) layoverMins = 0;
                }
                calculatedTotal += layoverMins;
                const layoverCity = currentSeg.Destination.Airport?.CityName || currentSeg.Destination.Airport?.AirportCode || 'Unknown';
                if (layoverMins > 0) {
                  layoverDetails.push(`${layoverCity} (${formatDuration(layoverMins)})`);
                } else {
                  layoverDetails.push(`${layoverCity}`);
                }
              }
            }
            totalDurationMins = lastSegment?.AccumulatedDuration || calculatedTotal;
            if (numStops === 1) {
              layoverStr = `1 Stop at ${layoverDetails[0]}`;
            } else {
              layoverStr = `${numStops} Stops at ${layoverDetails.join(', ')}`;
            }
          }

          return {
            id: f.ResultIndex || `adivaha_${index}`,
            traceId: traceId,
            tokenId: tokenId,
            resultIndex: f.ResultIndex,
            type: 'flight',
            airline: firstSegment.Airline?.AirlineName || 'Airlines',
            airlineCode: firstSegment.Airline?.AirlineCode,
            flight: `${firstSegment.Airline?.AirlineCode}-${firstSegment.Airline?.FlightNumber}`,
            from: firstSegment.Origin?.Airport?.AirportCode || origin,
            to: lastSegment?.Destination?.Airport?.AirportCode || destination,
            time: formatTime(firstSegment.Origin?.DepTime),
            arrival: formatTime(lastSegment?.Destination?.ArrTime),
            dur: formatDuration(totalDurationMins),
            stops: numStops,
            layover: layoverStr,
            price: Math.ceil(f.Fare?.OfferedFare || f.Fare?.PublishedFare || 0).toLocaleString('en-IN'),
            publishedPrice: Math.ceil(f.Fare?.PublishedFare || 0).toLocaleString('en-IN'),
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

  static async multicityFlightSearch(searchPayload) {
    try {
      const {
        adults = 1,
        children = 0,
        infants = 0,
        segments = []
      } = searchPayload;

      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toISOString().split('T')[0];
      };

      const categoryMap = {
        'Economy': 3,
        'Premium Economy': 4,
        'Business': 5,
        'First Class': 6
      };

      const mappedSegments = segments.map(seg => ({
        Origin: seg.from,
        Destination: seg.to,
        FlightCabinClass: categoryMap[seg.travelClass || 'Economy'] || 3,
        PreferredDepartureTime: formatDate(seg.departureDate),
        PreferredArrivalTime: formatDate(seg.departureDate)
      }));

      const payload = {
        action: "multicityflightSearch",
        adults: Number(adults),
        children: Number(children),
        infants: Number(infants),
        Segments: mappedSegments
      };

      const response = await adivahaClient.post('/?action=multicityflightSearch', payload);

      const errorObj = response.data?.responseData?.Response?.Error || response.data?.Response?.Error;
      if (errorObj && errorObj.ErrorMessage) {
        throw new Error(`Adivaha API Error: ${errorObj.ErrorMessage}`);
      }

      let resultsArray = response.data?.responseData?.Response?.Results ||
        response.data?.Response?.Results ||
        response.data?.Results;

      const traceId = response.data?.responseData?.Response?.TraceId ||
        response.data?.Response?.TraceId ||
        response.data?.TraceId;

      const tokenId = response.data?.responseData?.Response?.TokenId ||
        response.data?.Response?.TokenId ||
        response.data?.TokenId;

      if (resultsArray && resultsArray.length > 0) {
        if (Array.isArray(resultsArray[0])) {
          resultsArray = resultsArray[0];
        }

        const mappedFlights = resultsArray.map((f, index) => {
          let segmentsArray = f.Segments;
          if (!segmentsArray || segmentsArray.length === 0) return null;

          // Normalize to 1D array for easy access to first and last segment
          let allSegments = [];
          let is2D = Array.isArray(segmentsArray[0]);
          if (is2D) {
            segmentsArray.forEach(leg => allSegments.push(...leg));
          } else {
            allSegments = segmentsArray;
          }

          if (allSegments.length === 0) return null;

          const firstSeg = allSegments[0];
          const lastSeg = allSegments[allSegments.length - 1];

          const formatTime = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          };

          const formatDuration = (mins) => {
            if (!mins || isNaN(mins)) return '0m';
            const h = Math.floor(mins / 60);
            const m = Math.floor(mins % 60);
            if (h > 0 && m > 0) return `${h}h ${m}m`;
            if (h > 0) return `${h}h`;
            return `${m}m`;
          };

          let totalDurationMins = 0;
          let numStops = 0;
          let numLegs = 0;

          if (is2D) {
            numLegs = segmentsArray.length;
            segmentsArray.forEach((leg) => {
              numStops += (leg.length > 1 ? leg.length - 1 : 0);
              leg.forEach((seg) => {
                totalDurationMins += (seg.Duration || 0);
              });
            });
          } else {
            numLegs = segmentsArray.length;
            segmentsArray.forEach((seg) => {
              totalDurationMins += (seg.Duration || 0);
            });
            // If it's a 1D array in multicity, each segment is likely a direct leg
            numStops = 0;
          }

          return {
            id: f.ResultIndex || `adivaha_multi_${index}`,
            traceId: traceId,
            tokenId: tokenId,
            resultIndex: f.ResultIndex,
            type: 'flight',
            airline: firstSeg.Airline?.AirlineName || 'Airlines',
            airlineCode: firstSeg.Airline?.AirlineCode,
            flight: `${firstSeg.Airline?.AirlineCode}-${firstSeg.Airline?.FlightNumber}`,
            from: mappedSegments[0]?.Origin,
            to: mappedSegments[mappedSegments.length - 1]?.Destination,
            time: formatTime(firstSeg.Origin?.DepTime),
            arrival: formatTime(lastSeg.Destination?.ArrTime),
            dur: formatDuration(totalDurationMins),
            stops: numStops,
            layover: `Multi-City (${numLegs} Legs)`,
            price: Math.ceil(f.Fare?.OfferedFare || f.Fare?.PublishedFare || 0).toLocaleString('en-IN'),
            publishedPrice: Math.ceil(f.Fare?.PublishedFare || 0).toLocaleString('en-IN'),
            class: firstSeg.FareClassification?.Type || 'Economy',
            raw: f
          };
        }).filter(Boolean);

        return { flights: mappedFlights, rawAdivahaResponse: response.data };
      }

      return { flights: [], rawAdivahaResponse: response.data };
    } catch (error) {
      console.error('Adivaha multicityFlightSearch Error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async getFareRule(payload) {
    try {
      const { TraceId, ResultIndex, EndUserIp } = payload;
      const apiPayload = {
        action: "fareRule",
        ResultIndex,
        TraceId,
        EndUserIp
      };
      const response = await adivahaClient.post('/', apiPayload);
      return response.data;
    } catch (error) {
      console.error('Adivaha getFareRule Error:', error.response?.data || error.message);
      throw error;
    }
  }

  static async getFlightFareQuote(payload) {
    try {
      const { TraceId, ResultIndex, EndUserIp } = payload;
      const apiPayload = {
        action: "fareQuote",
        ResultIndex,
        TraceId,
        EndUserIp
      };
      const response = await adivahaClient.post('/', apiPayload);
      return response.data;
    } catch (error) {
      console.error('Adivaha getFlightFareQuote Error:', error.response?.data || error.message);
      throw error;
    }
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

  /**
   * Book a flight (LCC or Non-LCC)
   * POST https://api.adivaha.io/flights/api/
   * @param {Object} bookingPayload - Data for booking
   */
  static async bookFlight(bookingPayload) {
    try {
      const {
        isLCC,
        TraceId,
        ResultIndex,
        Passengers,
        ContactDetails
      } = bookingPayload;

      const apiPayload = {
        action: isLCC ? "ticket" : "book",
        TraceId,
        ResultIndex,
        Passengers,
        ContactDetails
      };

      const response = await adivahaClient.post('/', apiPayload);
      return response.data;
    } catch (error) {
      console.error(`Adivaha ${bookingPayload.isLCC ? 'Ticket' : 'Book'} Error:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get Special Service Requests (SSR) like meals, seats, and baggage
   * POST https://api.adivaha.io/flights/api/?action=flightSSR
   */
  static async getFlightSSR(payload) {
    try {
      const { TraceId, ResultIndex, EndUserIp } = payload;
      const apiPayload = {
        action: "flightSSR",
        ResultIndex,
        TraceId,
        EndUserIp
      };
      const response = await adivahaClient.post('/', apiPayload);
      return response.data;
    } catch (error) {
      console.error('Adivaha getFlightSSR Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = AdivahaFlightService;
