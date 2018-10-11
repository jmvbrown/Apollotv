const rp = require('request-promise');
const cheerio = require('cheerio');

async function RapidVideo(uri, jar) {
    let providerPageHtml = await rp({
        uri,
        jar,
        timeout: 5000
    });

    $ = cheerio.load(providerPageHtml);

    return $('source').attr('src');
}

module.exports = exports = RapidVideo;