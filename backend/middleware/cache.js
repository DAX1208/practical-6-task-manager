const NodeCache = require("node-cache");

/**
 * In-Memory Caching with node-cache
 * - stdTTL: 60 seconds default Time-To-Live
 * - checkperiod: 120 seconds automatic expired key cleanup
 */
const cache = new NodeCache({
    stdTTL: 60,
    checkperiod: 120,
    useClones: false
});

module.exports = cache;
