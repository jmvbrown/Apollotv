// Import dependencies
const jwt = require('jsonwebtoken');

// Define utility functions.
module.exports = {
    /**
     * Used to pad the series and episode numbers.
     * e.g. converts '1' to '01'.
     * @param value The number to pad.
     * @returns {string} The padded string.
     */
    padTvNumber: (value) => Number(value) < 10 ? `0${value}` : value,

    /**
     * Validates a request token in an ExpressJS request.
     * @param req The ExpressJS request to look for the token in.
     * @param res The response object to patch the response through to.
     * @param next The method to run if validation is successful.
     */
    verifyToken: (req, res, next) => {
        // check header or url parameters or post parameters for token
        const token = req.headers['x-access-token'] || req.body.token || req.query.token;
        if (!token) return res.status(403).json({auth: false, message: 'No token provided.'});

        // verifies secret and checks exp
        jwt.verify(token, process.env.SECRET_SERVER_ID, (err, decoded) => {
            if (err) return res.status(500).json({auth: false, message: 'Failed to authenticate token.'});

            // if everything is good, save to request for use in other routes
            req.userId = decoded.id;
            next();
        });
    }
};