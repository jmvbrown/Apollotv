const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');
const URL = require('url');
const m3u8 = require('m3u8-stream-list');

async function VidCloud(uri, jar, {userAgent}) {
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

    const sandbox = {jwplayer(){ return {setup(){}, on(){}, addButton(){}} }, $(){}};
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script').last()[0].children[0].data, sandbox);

    const promises = [];
    const sources = [];
    async function resolveHarder(source) {
        const file = await rp({
            uri: source,
            headers: {
                'user-agent': userAgent,
            },
            jar,
            timeout: 5000
        });
        sources.push({file: Buffer.from(file.replace(/seg/g, `${source.split('/').slice(0,-1).join('/')}/seg`)).toString('base64')});
    }

    async function resolve(source) {
        const urlData = URL.parse(source.file, true);
        if (urlData.pathname.endsWith('m3u8')) {
            const playlist = await rp({
                uri: source.file,
                headers: {
                    'user-agent': userAgent,
                },
                jar,
                timeout: 5000
            });
            const parsedPlaylist = m3u8(playlist);
            return Promise.all(parsedPlaylist.map(item => resolveHarder(item.url)));
        } else {
            sources.push({link: source.file});
        }
    }

    sandbox.config.sources.forEach((url) => {
        promises.push(resolve(url));
    });

    await Promise.all(promises);

    return sources;
}

module.exports = exports = VidCloud;