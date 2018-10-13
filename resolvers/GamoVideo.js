const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function GamoVideo(uri, jar, clientIp, userAgent, videoId) {
    const videoPageHtml = await rp({
        uri: streamPageUrl,
        headers: {
            'user-agent': userAgent,
            'Upgrade-Insecure-Requests': 1
        },
        followAllRedirects: true,
        jar,
        timeout: 5000
    });

    $ = cheerio.load(videoPageHtml);

    let setupObject = {};
    const sandbox = {jwplayer(){ return {setup(value){ setupObject = value; }, onTime(){}, onPlay(){}, onComplete(){}, onSeek(){}} }};
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script:contains("p,a,c,k,e,d")')[0].children[0].data, sandbox);

    const sources = [];
    setupObject.playlist.forEach(listItem => listItem.sources.forEach(source => sources.push(source.file)));

    return sources;
}

module.exports = exports = GamoVideo;