const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function Vidzi(uri, jar, clientIp, userAgent) {
    const videoPageHtml = await rp({
        uri,
        headers: {
            'user-agent': userAgent
        },
        jar,
        timeout: 5000
    });

    const $ = cheerio.load(videoPageHtml);

    let setupObject = {};
    const sandbox = {window: {}, jwplayer(){ return {setup(value){ setupObject = value; }, on(){}} }};
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script:contains("p,a,c,k,e,d")')[0].children[0].data, sandbox);

    return setupObject.sources;
}

module.exports = exports = Vidzi;