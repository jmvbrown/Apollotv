'use strict';

// Import dependencies
const express = require('express');
const logger = require('./src/utils/logger');

// Load and define application data
const pkg = require('./package.json');
require('dotenv').config();
const pathToApp = __dirname;

// Initialize express
let app = express();

// Load external ExpressJS middleware
const compression = require('compression');

app.use(require('cookie-parser')());
app.use(require('body-parser').json({limit: '1mb'}));
app.use(require('express-session')({secret: 'the claws are gonna git ya', resave: false, saveUninitialized: false}));
app.use(compression({filter: (req, res) => {
    if (req.headers['x-no-compression'] || req.headers['accept'] === 'text/event-stream') {
        // don't compress responses with this request header
        return false;
    }

    // fallback to standard filter function
    return compression.filter(req, res)
}}));

// Middleware: Initialise logging.
app.use(require('morgan')('combined', { stream: logger.stream }));

// Middlware: Add headers to API.
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "origin, X-Requested-With, Content-Type, Accept");
    next();
});


/** RENDERED ROUTES **/
app.get('/', function(req, res) {
    if(process.env.NODE_ENV === 'production'){
        // When in production, redirect to the main site.
        res.redirect("https://apollotv.xyz/");
    }else {
        // Otherwise, send index file.
        res.sendFile(`${pathToApp}/public/index.html`);
    }
});
app.get('/bcrypt.js', (req, res) => res.sendFile(`${pathToApp}/public/bcrypt.js`));
/** ./RENDERED ROUTES **/


/** API ROUTES **/
const authRoutes = require('./src/api/authRoutes');
app.use('/api/v1', authRoutes);

const searchRoutes = require('./src/api/searchRoutes');
app.use('/api/v1/search', searchRoutes);
/** ./API ROUTES **/


// Start listening...
app.listen(process.env.PORT, () => {
    // Always binds to localhost.
    console.log(`${pkg.name} v${pkg.version} server listening on: http://127.0.0.1:${process.env.PORT}`);
});

// Test a resolver with the below code

// const Openload = require('./resolvers/Openload');
// (async function() {
//  const videoSourceUrl = await Openload('https://openload.co/embed/WimYxMz-Wlk', require('request-promise').jar(), '77.111.246.9');
//  console.log(videoSourceUrl);
// })()
