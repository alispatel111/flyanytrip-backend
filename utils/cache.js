const NodeCache = require('node-cache');

// Standard cache for API responses (e.g., flight searches) to reduce load
// stdTTL: Default time-to-live is 5 minutes (300 seconds) since flight prices change often
// checkperiod: Delete expired keys every 60 seconds
const apiCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const generateCacheKey = (prefix, params) => {
  return `${prefix}_${Buffer.from(JSON.stringify(params)).toString('base64')}`;
};

module.exports = {
  apiCache,
  generateCacheKey,
};
