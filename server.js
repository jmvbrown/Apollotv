'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const api = require('./api');
const verifyToken = require('./api');
const morgan = require('morgan')
const logger = require('./utils/logger')

require('dotenv').config();

let app = express();

const pathToApp = __dirname;
app.use(express.static(`${pathToApp}/public`));
app.use(require('cookie-parser')());
app.use(bodyParser.json({limit: '1mb'}));
app.use(require('express-session')({secret: 'the claws are gonna git ya', resave: false, saveUninitialized: false}));
app.use(compression({filter: (req, res) => {
    if (req.headers['x-no-compression'] || req.headers['accept'] === 'text/event-stream') {
        // don't compress responses with this request header
        return false;
    }

    // fallback to standard filter function
    return compression.filter(req, res)
}}));

app.use(morgan('combined', { stream: logger.stream }))

app.get('/', function(req, res) {
    res.sendFile(`${pathToApp}/public/index.html`);
});

app.post('/api/login', api.login);
app.get('/api/search', api.verifyToken, api.search);

app.get('/api/search/tv', api.verifyToken, api.searchTv);


app.listen(3000, () => {
    console.log('express server listening on: 3000');
});