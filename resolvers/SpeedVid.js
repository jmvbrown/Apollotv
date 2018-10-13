const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function SpeedVid(uri, jar, clientIp, userAgent) {
    const videoPageHtml = await rp({
        uri,
        headers: {
            'user-agent': userAgent,
            'Cache-Control': 'no-cache',
            'Host': 'www.speedvid.net',
            'Pragma': 'no-cache',
            'Upgrade-Insecure-Requests': '1',
        },
        jar,
        timeout: 5000
    });

    let $ = cheerio.load(videoPageHtml);

    // starting variables
    let videoSourcePageUrl = '';
    const sandbox = {location: {assign(redirectUrl){ videoSourcePageUrl = `http://www.speedvid.net${redirectUrl}`}}};
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script').last()[0].children[0].data, sandbox);

    const videoSourceHtml = await rp({
        uri: videoSourcePageUrl,
        headers: {
            'user-agent': userAgent
        },
        jar,
        timeout: 5000
    });

    $ = cheerio.load(videoSourceHtml);

    return $('source').attr('src');
}

module.exports = exports = SpeedVid;