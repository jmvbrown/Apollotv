const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const vm = require('vm');

const Openload = require('../../resolvers/Openload');

async function SeriesFree(req, sse) {
    const showTitle = req.query.title;
    const {season, episode} = req.query;

    // These providers were in the Terarium source, but are now dead..... We need to find others
    // https://seriesfree1.bypassed.bz, https://seriesfree1.bypassed.eu, https://seriesfree1.bypassed.bz

    const urls = ["https://seriesfree.to"];
    const promises = [];
    let browser;

    // Go to each url and scrape for links, then send the link to the client
    async function scrape(url) {
        try {
            const jar = rp.jar();
            const userAgent = randomUseragent.getRandom();
            const html = await rp({
                uri: `${url}/search/${showTitle.replace(/ \(.*\)/, '').replace(/ /, '%20')}`,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(html);

            let showUrl = '';

            $('.serie-title').toArray().some(element => {
                if ($(element).text() === showTitle) {
                    showUrl = `${url}${$(element).parent().attr('href')}`;
                    return true;
                }
                return false;
            })

            const videoPageHtml = await rp({
                uri: showUrl,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            $ = cheerio.load(videoPageHtml);

            let episodeUrl = '';
            $('.sinfo').toArray().some(element => {
                if ($(element).text() === `${season}×${episode}`) {
                    episodeUrl = `${url}${$(element).parent().attr('href')}`;
                    return true;
                }
                return false;
            });

            const episodePageHtml = await rp({
                uri: episodeUrl,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            $ = cheerio.load(episodePageHtml);

            const videoUrls = $('.watch-btn').toArray().map(element => `${url}${$(element).attr('href')}`);

            videoUrls.forEach(async (videoUrl) => {
                try {
                    const videoPageHtml = await rp({
                        uri: videoUrl,
                        headers: {
                            'user-agent': userAgent,
                            'x-real-ip': req.client.remoteAddress,
                            'x-forwarded-for': req.client.remoteAddress
                        },
                        jar,
                        timeout: 5000
                    });

                    $ = cheerio.load(videoPageHtml);

                    const streamPageUrl = $('.action-btn').attr('href');

                    if (streamPageUrl.includes('openload.co')) {
                        const path = streamPageUrl.split('/');
                        const videoSourceUrl = await Openload(`https://openload.co/embed/${path[path.length - 1]}`, jar, req.client.remoteAddress);
                        sse.send({videoSourceUrl, url, provider: 'https://openload.co', ipLocked: true}, 'results');
                    } else if (streamPageUrl.includes('vidlox.me')) {
                        const videoSourceHtml = await rp({
                            uri: streamPageUrl,
                            headers: {
                                'user-agent': userAgent,
                                'x-real-ip': req.client.remoteAddress,
                                'x-forwarded-for': req.client.remoteAddress
                            },
                            jar,
                            timeout: 5000
                        });
                        const videoSourceUrls = JSON.parse(/(?:sources:\s)(\[.*\])/g.exec(videoSourceHtml)[1]);
                        videoSourceUrls.forEach(videoSourceUrl => sse.send({videoSourceUrl, url, provider: 'https://vidlox.me'}, 'results'));
                    } else if (streamPageUrl.includes('vshare.eu')) {
                        const path = streamPageUrl.split('/');
                        const videoId = path[path.length - 1].replace('.htm', '');
                        const videoSourceHtml = await rp({
                            uri: `https://vshare.eu/embed-${videoId}-729x400.html`,
                            headers: {
                                'user-agent': userAgent
                            },
                            jar,
                            timeout: 5000
                        });

                        $ = cheerio.load(videoSourceHtml);

                        sse.send({videoSourceUrl: $('source').attr('src'), url, provider: 'https://vidlox.me'}, 'results');
                    } else if (streamPageUrl.includes('speedvid.net')) {
                        const path = streamPageUrl.split('/');
                        const videoId = path[path.length - 1];
                        const videoPageHtml = await rp({
                            uri: `http://www.speedvid.net/embed-${videoId}-1280x720.html`,
                            headers: {
                                'user-agent': userAgent
                            },
                            jar,
                            followAllRedirects: true,
                            timeout: 5000
                        });

                        $ = cheerio.load(videoPageHtml);

                        // starting variables
                        let videoSourcePageUrl = '';
                        const sandbox = {location: {assign(redirectUrl){ videoSourcePageUrl = `http://www.speedvid.net${redirectUrl}`}}};
                        vm.createContext(sandbox); // Contextify the sandbox.
                        vm.runInContext($('script').last()[0].children[0].data, sandbox);

                        const videoSourceHtml = await rp({
                            uri: videoSourcePageUrl,
                            headers: {
                                'user-agent': userAgent
                            },
                            jar,
                            timeout: 5000
                        });

                        $ = cheerio.load(videoSourceHtml);

                        const videoSourceUrl = $('source').attr('src');

                        sse.send({videoSourceUrl, url, provider: 'http://www.speedvid.net'}, 'results');
                    } else if (streamPageUrl.includes('vidcloud.co')) {
                        const path = streamPageUrl.split('/');
                        const videoId = path[path.length - 2];
                        const videoSourceObject = await rp({
                            uri: `https://vidcloud.co/player?fid=${videoId}&page=video`,
                            headers: {
                                'user-agent': userAgent
                            },
                            jar,
                            json: true,
                            timeout: 5000
                        });

                        $ = cheerio.load(videoSourceObject.html);

                        const sandbox = {jwplayer(){ return {setup(){}, on(){}, addButton(){}} }, $(){}};
                        vm.createContext(sandbox); // Contextify the sandbox.
                        vm.runInContext($('script').last()[0].children[0].data, sandbox);

                        const videoSourceUrl = sandbox.config.sources[0].file;

                        sse.send({videoSourceUrl, url, provider: 'https://vidcloud.co'}, 'results');
                    } else if (streamPageUrl.includes('clipwatching.com')) {
                        const videoPageHtml = await rp({
                            uri: streamPageUrl,
                            headers: {
                                'user-agent': userAgent
                            },
                            jar,
                            timeout: 5000
                        });

                        $ = cheerio.load(videoPageHtml);

                        let setupObject = {};
                        const sandbox = {jwplayer(){ return {setup(value){ setupObject = value; }, onTime(){}, onPlay(){}, onComplete(){}, onReady(){}} }};
                        vm.createContext(sandbox); // Contextify the sandbox.
                        vm.runInContext($('script:contains("p,a,c,k,e,d")')[0].children[0].data, sandbox);

                        setupObject.sources.forEach((source) => {
                            sse.send({videoSourceUrl: source.file, quality: source.label, url, provider: 'http://clipwatching.com'}, 'results');
                        });
                    } else if (streamPageUrl.includes('estream.to') || streamPageUrl.includes('estream.xyz')) {
                        const path = streamPageUrl.split('/');
                        const videoId = path[path.length - 1];
                        const videoPageHtml = await rp({
                            uri: `http://estream.xyz/embed-${videoId}`,
                            headers: {
                                'user-agent': userAgent
                            },
                            jar,
                            timeout: 5000
                        });

                        $ = cheerio.load(videoPageHtml);

                        $('source').toArray().forEach((sourceElement) => {
                            sse.send({videoSourceUrl: $(sourceElement).attr('src'), url, provider: 'https://estream.to'}, 'results');
                        });
                    } else if (streamPageUrl.includes('vidzi.online')) {
                        const videoPageHtml = await rp({
                            uri: streamPageUrl,
                            headers: {
                                'user-agent': userAgent
                            },
                            jar,
                            timeout: 5000
                        });

                        $ = cheerio.load(videoPageHtml);

                        let setupObject = {};
                        const sandbox = {window: {}, jwplayer(){ return {setup(value){ setupObject = value; }, on(){}} }};
                        vm.createContext(sandbox); // Contextify the sandbox.
                        vm.runInContext($('script:contains("p,a,c,k,e,d")')[0].children[0].data, sandbox);

                        setupObject.sources.forEach((source) => {
                            sse.send({videoSourceUrl: source.file, url, provider: 'https://vidzi.online'}, 'results');
                        });
                    } else if (streamPageUrl.includes('vidto.me')) {
                        console.log('Skipping vidoto.me because the links are always broken.');
                    } else if (streamPageUrl.includes('vidup.me') || streamPageUrl.includes('vidup.tv') || streamPageUrl.includes('thevideo.me')) {
                        console.log('Skipping vidup.me because they use captcha, which puppeteer can get around, but the links are usually low quality.');
                    } else if (streamPageUrl.includes('vidtodo.me')) {
                        // const videoSourceHtml = await rp({
                        //     uri: streamPageUrl,
                        //     headers: {
                        //         'user-agent': userAgent
                        //     },
                        //     jar,
                        //     timeout: 5000
                        // });
                        // const videoSourcesString = /(?:sources:\s)(\[.*\])/g.exec(videoSourceHtml)[1];
                        // const sandbox = {};
                        // vm.createContext(sandbox); // Contextify the sandbox.
                        // const videoSources = vm.runInContext(videoSourcesString, sandbox);
                        // videoSources.forEach(source => sse.send({videoSourceUrl: source.file, quality: source.label, url, provider: 'https://vidtodo.me'}, 'results'));

                        console.log('Skipping vidtodo.me because IP locked and the header trick (x-real-ip, x-forwarded-for) is not working');
                    } else if (streamPageUrl.includes('powvideo.net')) {
//                         const path = streamPageUrl.split('/');
//                         const videoId = path[path.length - 1];
//                         const videoSourceHtml = await rp({
//                             uri: `https://povwideo.cc/iframe-${videoId}-954x562.html`,
//                             headers: {
//                                 'user-agent': userAgent,
//                                 referer: `https://povwideo.cc/preview-${videoId}-954x562.html`,
//                                 'cache-control': 'no-cache',
//                                 'pragma': 'no-cache',
//                                 'upgrade-insecure-requests': '1',
//                             },
//                             jar,
//                             timeout: 5000
//                         });
//
//                         $ = cheerio.load(videoSourceHtml);
//
//                         let videoSources = [];
//                         const jwplayer = () => ({setup(){ return this;}, on(){ return this; }});
//                         const sandbox = {jwplayer, jQuery: {map(sources){ videoSources = sources; return {size(){}}; }}, sources: []};
//                         vm.createContext(sandbox); // Contextify the sandbox.
//                         vm.runInContext($('script:contains("p,a,c,k,e,d")')[0] && $('script:contains("p,a,c,k,e,d")')[0].children[0].data, sandbox);
//                         videoSources.forEach(source => sse.send({videoSourceUrl: source.src, url, provider: 'https://powvideo.net'}, 'results'));

                        console.log('Skipping powvideo.net because IP locked and the header trick (x-real-ip, x-forwarded-for) is not working');
                    } else if (streamPageUrl.includes('streamplay.to')) {
                        console.log('Skipping streamplay.to because captcha.');
                    } else if (streamPageUrl.includes('gamovideo.com')) {
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

                        setupObject.playlist.forEach(listItem => {
                            listItem.sources.forEach(source => {
                                sse.send({videoSourceUrl: source.file, url, provider: 'http://gamovideo.com'}, 'results');
                            })
                        });
                    } else {
                        console.log('Still need a resolver for', streamPageUrl);
                    }
                } catch(err) {
                    console.log(`No source found at ${videoUrl}`);
                }
            })
        } catch (err) {
            console.error(err);
            if (err.cause && err.cause.code !== 'ETIMEDOUT') {
                console.error(err);
                sse.send({ url, message: 'Looks like this provider is down.' }, 'error');
            }
        }
    }

    // Asyncronously start all the scrapers for each url
    urls.forEach((url) => {
        promises.push(scrape(url));
    });
}

module.exports = exports = SeriesFree;
