const adivahaService = require('../integrations/adivaha/adivaha.service');
const { apiCache, generateCacheKey } = require('../utils/cache');

const searchFlights = async (req, res, next) => {
  try {
    const searchParams = req.query; // Assuming parameters are passed via query string
    
    // Basic validation
    if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: origin, destination, or departureDate',
      });
    }

    // Generate a unique cache key based on search parameters
    const cacheKey = generateCacheKey('flight_search', searchParams);

    // Check if the result exists in the cache
    const cachedResult = apiCache.get(cacheKey);
    if (cachedResult) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: cachedResult,
      });
    }

    // Call the real Adivaha API via our integration service
    const searchResults = await adivahaService.searchFlights(searchParams);

    // Cache the result for subsequent similar searches
    apiCache.set(cacheKey, searchResults.flights);

    return res.status(200).json({
      success: true,
      source: 'api',
      data: { flights: searchResults.flights },
    });
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

const searchLocations = async (req, res, next) => {
  try {
    const { term } = req.query;
    if (!term) {
      return res.status(400).json({ success: false, message: 'Term is required' });
    }
    
    // Check cache
    const cacheKey = generateCacheKey('locations', { term });
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, source: 'cache', data: cached });
    }

    const locations = await adivahaService.searchLocations(term, 10);
    apiCache.set(cacheKey, locations);

    return res.status(200).json({ success: true, source: 'api', data: locations });
  } catch (error) {
    next(error);
  }
};

const getCalendarFare = async (req, res, next) => {
  try {
    const { origin, destination, departureDate, cabinClass } = req.query;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: origin, destination, or departureDate',
      });
    }

    const cacheKey = generateCacheKey('calendar_fare', { origin, destination, departureDate, cabinClass });
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, source: 'cache', data: cached });
    }

    const result = await adivahaService.getCalendarFare({ origin, destination, departureDate, cabinClass });
    
    // Check if response contains valid results
    const fares = result?.responseData?.Response?.SearchResults || [];
    
    apiCache.set(cacheKey, fares);

    return res.status(200).json({
      success: true,
      source: 'api',
      data: fares
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchFlights,
  searchLocations,
  getCalendarFare,
};
