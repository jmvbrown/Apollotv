const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function PowVideo(uri, jar, clientIp, userAgent, videoId) {
    const videoSourceHtml = await rp({
        uri,
        headers: {
            'user-agent': userAgent,
            referer: `https://povwideo.cc/preview-${videoId}.html`,
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'upgrade-insecure-requests': '1',
        },
        jar,
        timeout: 5000
    });

    const $ = cheerio.load(videoSourceHtml);

    let videoSources = [];
    const jwplayer = () => ({setup(){ return this;}, on(){ return this; }});
    const sandbox = {jwplayer, jQuery: {map(sources){ videoSources = sources; return {size(){}}; }}, sources: []};
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script:contains("p,a,c,k,e,d")')[0] && $('script:contains("p,a,c,k,e,d")')[0].children[0].data, sandbox);

    return videoSources;
}

module.exports = exports = PowVideo;