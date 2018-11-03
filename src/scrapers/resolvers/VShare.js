const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function VShare(uri, jar, {userAgent}) {
    const videoSourceHtml = await rp({
        uri,
        headers: {
            'user-agent': userAgent
        },
        jar,
        timeout: 5000
    });

    const $ = cheerio.load(videoSourceHtml);

    const source = $('source').attr('src');

    if (!source) {
        throw "File does not exist or has been removed";
    }

    return source;
}

module.exports = exports = VShare;