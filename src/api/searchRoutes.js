'use strict';

// Import dependencies
const SSE = require('express-sse');
const {verifyToken} = require('../utils');
const emitter = require('../utils/eventEmitter');

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
searchRoutes.get('/movies', verifyToken, async (req, res) => {
    const sse = new SSE();
    sse.init(req, res);
    sendInitialStatus(sse);

    const promises = [];

    // Get movie providers.
    [...providers.movies, ...providers.universal].forEach(provider => promises.push(provider(req, sse)));

    req.on('close', function() {
        console.log('disconnected');
        emitter.emit('disconnected');
    });

    emitter.on('disconnected', () => {
        sse.stopExecution = true;
    });

    await Promise.all(promises);
    sse.send({event: 'done'}, 'done');
});

/**
 * /api/v1/search/tv
 * ------
 * Allows you to search for TV shows.
 */
searchRoutes.get('/tv', verifyToken, async (req, res) => {
    const sse = new SSE();
    sse.init(req, res);
    sendInitialStatus(sse);

    const promises = [];

    // Get TV providers.
    [...providers.tv, ...providers.universal].forEach(provider => promises.push(provider(req, sse)));

    req.on('close', function() {
        console.log('disconnected');
        emitter.emit('disconnected');
    });

    emitter.on('disconnected', () => {
        sse.stopExecution = true;
    });

    await Promise.all(promises);
    sse.send({event: 'done'}, 'done');
});

module.exports = searchRoutes;