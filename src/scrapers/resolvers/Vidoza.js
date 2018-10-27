const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function Vidoza(uri, jar, clientIp, userAgent) {
    const videoPageHtml = await rp({
        uri,
        headers: {
            'user-agent': userAgent
        },
        jar,
        timeout: 5000
    });

    $ = cheerio.load(videoPageHtml);

    const sandbox = {window: {}};
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script:contains("pData")')[0].children[0].data, sandbox);

    return sandbox.window.pData.sourcesCode;
}

module.exports = exports = Vidoza;