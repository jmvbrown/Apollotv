'use strict';

// Import dependencies
const SSE = require('express-sse');
const rp = require('request-promise');
const {verifyToken} = require('../utils');

// Load providers
const resolveHtml = require('../scrapers/resolvers/resolveHtml');

// Declare new router and start defining routes:
const resolveRoutes = require('express').Router();

/**
 * Sends the current time in milliseconds.
 */
const sendInitialStatus = (sse) => sse.send({ data: [`${new Date().getTime()}`], event: 'status'}, 'result');

/**
 * /api/v1/search/movies
 * ------
 * Allows you to search for movies.
 */
resolveRoutes.post('/:resolver', verifyToken, (req, res) => {
    const jar = rp.jar();
    resolveHtml(req.body.html, req.params.resolver, jar, req.bod.headers);
});

module.exports = resolveRoutes;