'use strict';

// Import dependencies
const SSE = require('express-sse');
const utils = require('../utils');

// Load providers
const providers = require('../providers');

// Declare new router and start defining routes:
const searchRoutes = require('express').Router();

/**
 * Sends the current time in milliseconds.
 */
const sendInitialStatus = () => {
    // initial `status` message for debug on client
    sse.send({ data: [`${new Date().getTime()}`], event: 'status'}, 'result');
};

/**
 * /api/v1/search/movies
 * ------
 * Allows you to search for movies.
 */
searchRoutes.get('/movies', utils.verifyToken, (req, res) => {
    const sse = new SSE();
    sse.init(req, res);
    sendInitialStatus();

    // Get movie providers.
    [...providers.movies, ...providers.universal].forEach(provider => provider(req, sse));
});

/**
 * /api/v1/search/tv
 * ------
 * Allows you to search for TV shows.
 */
searchRoutes.get('/tv', utils.verifyToken, (req, res) => {
    const sse = new SSE();
    sse.init(req, res);
    sendInitialStatus();

    // Get TV providers.
    [...providers.tv, ...providers.universal].forEach(provider => provider(req, sse));
});

module.exports = searchRoutes;