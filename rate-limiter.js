const pm2 = require('pm2');
const {RateLimiterClusterMasterPM2} = require('rate-limiter-flexible');

new RateLimiterClusterMasterPM2(pm2);