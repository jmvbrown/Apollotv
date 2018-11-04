const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

// I think there's some throttling going on, but haven't tested enough to find the time span for a "ban" reset

async function GamoVideo(uri, jar, {'user-agent': userAgent}) {
    const videoPageHtml = await rp({
        uri,
        headers: {
            'user-agent': userAgent,
            'Upgrade-Insecure-Requests': 1,
            Host: 'gamovideo.com'
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

    return sources.filter(source => !source.startsWith('rtmp'));
}

module.exports = exports = GamoVideo;