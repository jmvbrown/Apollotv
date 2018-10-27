const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function Vidlox(uri, jar, clientIp, userAgent) {
    const videoSourceHtml = await rp({
        uri,
        headers: {
            'user-agent': userAgent,
            'x-real-ip': clientIp,
            'x-forwarded-for': clientIp
        },
        jar,
        timeout: 5000
    });
    return JSON.parse(/(?:sources:\s)(\[.*\])/g.exec(videoSourceHtml)[1]);
}

module.exports = exports = Vidlox;