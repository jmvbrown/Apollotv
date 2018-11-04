'use strict';

// Import dependencies
const SSE = require('express-sse');
const {verifyToken} = require('../utils');

// Load providers
const providers = require('../scrapers/providers');

// Declare new router and start defining routes:
const searchRoutes = require('express').Router();

/**
 * Sends the current time in milliseconds.
 */
const sendInitialStatus = (sse) => sse.send({ data: [`${new Date().getTime()}`], event: 'status'}, 'result');

/**
 * /api/v1/search/movies
 * ------
 * Allows you to search for movies.
 */
searchRoutes.get('/movies', verifyToken, (req, res) => {
    const sse = new SSE();
    sse.init(req, res);
    sendInitialStatus(sse);

    // Get movie providers.
    [...providers.movies, ...providers.universal].forEach(provider => provider(req, sse));
});

/**
 * /api/v1/search/tv
 * ------
 * Allows you to search for TV shows.
 */
searchRoutes.get('/tv', verifyToken, (req, res) => {
    const sse = new SSE();
    sse.init(req, res);
    sendInitialStatus(sse);

    // Get TV providers.
    [...providers.tv, ...providers.universal].forEach(provider => provider(req, sse));
});

module.exports = searchRoutes;