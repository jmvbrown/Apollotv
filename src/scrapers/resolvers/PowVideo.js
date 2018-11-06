const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');
const URL = require('url');
const m3u8 = require('m3u8-stream-list');

async function PowVideo(uri, jar, headers, videoId) {
    const videoSourceHtml = await rp({
        uri,
        headers: {
            ...headers,
            referer: `https://povwideo.cc/preview-${videoId}-954x562.html`,
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

    const promises = [];
    const sources = [];

    async function resolveHarder(uri) {
        const file = await rp({
            uri,
            headers: {
                'user-agent': headers['user-agent'],
            },
            jar,
            timeout: 5000
        });
        sources.push({file: Buffer.from(file.replace(/\n(.*)(\.ts\?video=\d+)/g, `\n${uri.split('/').slice(0,-1).join('/')}/$1$2`)).toString('base64')});
    }

    async function resolve(uri) {
        const urlData = URL.parse(uri, true);
        if (urlData.pathname.endsWith('m3u8')) {
            const playlist = await rp({
                uri,
                headers: {
                    'user-agent': headers['user-agent'],
                },
                jar,
                timeout: 5000
            });
            const parsedPlaylist = m3u8(playlist);
            return Promise.all(parsedPlaylist.map(item => resolveHarder(item.url)));
        } else if (!uri.startsWith('rtmp')) {
            sources.push({link: uri});
        }
    }

    sandbox.sources.forEach((source) => {
        promises.push(resolve(source.file));
    });

    await Promise.all(promises);

    return sources;
}

module.exports = exports = PowVideo;