const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');
const {timeout} = require('../../utils');

async function Vidoza(uri, jar, {'user-agent': userAgent}) {
    let videoPageHtml = '';
    let attempt = 0;
    while(attempt < 5 && !videoPageHtml) {
        try {
            console.log(attempt, uri);
            videoPageHtml = await rp({
                uri,
                timeout: 5000
            });
            console.log('success', uri);
        } catch (err) {
            console.log('fail', uri);
            await timeout(3000);
            attempt++;
        }
    }

    if (videoPageHtml && videoPageHtml !== 'File was deleted') {
        $ = cheerio.load(videoPageHtml);

        const sandbox = {window: {}};
        vm.createContext(sandbox); // Contextify the sandbox.
        vm.runInContext($('script:contains("pData")')[0].children[0].data, sandbox);

        return sandbox.window.pData.sourcesCode;
    } else {
        throw 'Vidoza: File was deleted';
    }

}

module.exports = exports = Vidoza;