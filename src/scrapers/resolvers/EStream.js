const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function EStream(uri, jar, clientIp, userAgent) {
    const videoPageHtml = await rp({
        uri,
        headers: {
            'user-agent': userAgent
        },
        jar,
        timeout: 5000
    });

    const $ = cheerio.load(videoPageHtml);

    return $('source').toArray().map((sourceElement) => $(sourceElement).attr('src'));
}

module.exports = exports = EStream;