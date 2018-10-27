const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function PowVideo(uri, jar, clientIp, userAgent, videoId) {
    const videoSourceHtml = await rp({
        uri,
        headers: {
            'user-agent': userAgent,
            referer: `https://povwideo.cc/preview-${videoId}-954x562.html`,
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'upgrade-insecure-requests': '1',
            'x-real-ip': clientIp,
            'x-forwarded-for': clientIp
        },
        jar,
        timeout: 5000
    });

    const $ = cheerio.load(videoSourceHtml);
    let videoSources = [];
    const jwplayer = () => ({setup(){ return this;}, on(){ return this; }});
    const jQuery = {
        map(sources, func) {
            return sources.map(func);
        },
        cookie() {
            return true;
        }
    };
    const sandbox = {
        jwplayer,
        jQuery,
        $: jQuery,
        sources: [],
        window: {},
        document: {
            createElement(){
                return {}
            },
            getElementsByTagName() {
                return {
                    0: {
                        parentNode: {
                            insertBefore(){}
                        }
                    }
                }
            }
        },
        ga(){}
    };
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script:contains("Array")')[0].children[0].data, sandbox);
    vm.runInContext($('script:contains("p,a,c,k,e,d")')[0].children[0].data, sandbox);

    return sandbox.sources;
}

module.exports = exports = PowVideo;