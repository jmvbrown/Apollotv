const SSE = require('express-sse');
const providers = require('./providers');

function search(req, res) {
    const sse = new SSE();
    sse.init(req, res);

    for (let provider of providers) {
        provider(req.query.queryString, sse);
    }
}

exports.search = search;