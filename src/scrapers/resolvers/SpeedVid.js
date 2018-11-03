const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function SpeedVid(uri, jar, {userAgent}) {
    const videoPageHtml = await rp({
        uri,
        headers: {
            'user-agent': userAgent,
            'Cache-Control': 'no-cache',
            'Host': 'www.speedvid.net',
            'Pragma': 'no-cache',
            'Upgrade-Insecure-Requests': '1'
        },
        jar,
        timeout: 5000
    });

    let $ = cheerio.load(videoPageHtml);

    // starting variables
    let videoSourcePageUrl = '';
    const location = {assign(redirectUrl){ videoSourcePageUrl = `http://www.speedvid.net${redirectUrl}`}, href: ''};
    let sandbox = {location, window: {location}};
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script').last()[0].children[0].data, sandbox);

    const videoSourceHtml = await rp({
        uri: videoSourcePageUrl || `http://www.speedvid.net${location.href}`,
        headers: {
            'user-agent': userAgent,
            'Referer': uri,
            'Cookie': (Math.floor((900 - 100) * Math.random()) + 100) * ((new Date()).valueOf() / 1000) * (128 / 8)
        },
        jar,
        timeout: 5000
    });

    $ = cheerio.load(videoSourceHtml);

    let setupObject = {};
    sandbox = {jwplayer(){ return {setup(value){ setupObject = value; }} }, primary: true};
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($(`script:contains("jwplayer('vplayer').setup")`)[0].children[0].data, sandbox);
    return setupObject.file;
}

module.exports = exports = SpeedVid;