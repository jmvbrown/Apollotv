const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');
const URL = require('url');
const m3u8 = require('m3u8-stream-list');

async function VidCloud(uri, jar, {'user-agent': userAgent}) {
    const videoSourceObject = await rp({
        uri,
        headers: {
            'user-agent': userAgent
        },
        jar,
        json: true,
        timeout: 5000
    });

    const $ = cheerio.load(videoSourceObject.html);

    const sandbox = {jwplayer(){ return {setup(){}, on(){}, addButton(){}} }, $(){}, jQuery: {browser: {mobile: true}}};
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script').last()[0].children[0].data, sandbox);

    const promises = [];
    const sources = [];
    async function resolveHarder(uri) {
        const file = await rp({
            uri,
            headers: {
                'user-agent': userAgent,
            },
            jar,
            timeout: 5000
        });
        sources.push({file: Buffer.from(file.replace(/seg/g, `${uri.split('/').slice(0,-1).join('/')}/seg`)).toString('base64')});
    }

    async function resolve(uri) {
        const urlData = URL.parse(uri, true);
        if (urlData.pathname.endsWith('m3u8')) {
            const playlist = await rp({
                uri,
                headers: {
                    'user-agent': userAgent,
                },
                jar,
                timeout: 5000
            });
            const parsedPlaylist = m3u8(playlist);
            return Promise.all(parsedPlaylist.map(item => resolveHarder(item.url)));
        } else {
            sources.push({link: uri});
        }
    }

    sandbox.sources.forEach((source) => {
        promises.push(resolve(source.file));
    });

    await Promise.all(promises);

    return sources;
}

module.exports = exports = VidCloud;