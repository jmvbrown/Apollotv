const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const vm = require('vm');

const Openload = require('../../resolvers/Openload');
const Vidlox = require('../../resolvers/Vidlox');
const VShare = require('../../resolvers/VShare');
const SpeedVid = require('../../resolvers/SpeedVid');
const VidCloud = require('../../resolvers/VidCloud');
const ClipWatching = require('../../resolvers/ClipWatching');
const EStream = require('../../resolvers/EStream');
const Vidzi = require('../../resolvers/Vidzi');
const VidTodo = require('../../resolvers/VidTodo');
const PowVideo = require('../../resolvers/PowVideo');
const GamoVideo = require('../../resolvers/GamoVideo');

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

                try {
                    if (streamPageUrl.includes('openload.co')) {
                        // const path = streamPageUrl.split('/');
                        // const videoSourceUrl = await Openload(`https://openload.co/embed/${path[path.length - 1]}`, jar, req.client.remoteAddress, userAgent);
                        // sse.send({videoSourceUrl, url, provider: 'https://openload.co', ipLocked: true}, 'results');

                    } else if (streamPageUrl.includes('vidlox.me')) {
                        // const videoSourceUrls = await Vidlox(streamPageUrl, jar, req.client.remoteAddress, userAgent);
                        // videoSourceUrls.forEach(source => sse.send({videoSourceUrl: source, url, provider: 'https://vidlox.me'}, 'results'));

                    } else if (streamPageUrl.includes('vshare.eu')) {
                        // const path = streamPageUrl.split('/');
                        // const videoId = path[path.length - 1].replace('.htm', '');
                        // const videoSourceUrl = await VShare(`https://vshare.eu/embed-${videoId}.html`, jar, req.client.remoteAddress, userAgent);
                        // sse.send({videoSourceUrl, url, provider: 'https://vshare.eu'}, 'results');

                    } else if (streamPageUrl.includes('speedvid.net')) {
                        // const path = streamPageUrl.split('/');
                        // const videoId = path[path.length - 1];
                        // const videoSourceUrl = await SpeedVid(`http://speedvid.net/embed-${videoId}.html`, jar, req.client.remoteAddress, userAgent);
                        // sse.send({videoSourceUrl, url, provider: 'http://www.speedvid.net'}, 'results');

                    } else if (streamPageUrl.includes('vidcloud.co')) {
                        // const path = streamPageUrl.split('/');
                        // const videoId = path[path.length - 2];
                        // const videoSourceUrls = await VidCloud(`https://vidcloud.co/player?fid=${videoId}&page=video`, jar, req.client.remoteAddress, userAgent);
                        // videoSourceUrls.forEach(source => {
                        //     if (!!source.m3u8File) {
                        //         sse.send({m3u8File: source.m3u8File, url, provider: 'https://vidcloud.co'}, 'results')
                        //     } else {
                        //         sse.send({videoSourceUrl: source.videoSourceUrl, url, provider: 'https://vidcloud.co'}, 'results')
                        //     }
                        // });

                    } else if (streamPageUrl.includes('clipwatching.com')) {
                        const sources = await ClipWatching(streamPageUrl, jar, req.client.remoteAddress, userAgent);
                        sources.forEach(source => sse.send({videoSourceUrl: source.file, quality: source.label, url, provider: 'http://clipwatching.com'}, 'results'));

                    } else if (streamPageUrl.includes('estream.to') || streamPageUrl.includes('estream.xyz')) {
                        // const path = streamPageUrl.split('/');
                        // const videoId = path[path.length - 1];
                        // const videoSourceUrls = await EStream(`http://estream.xyz/embed-${videoId}`, jar, req.client.remoteAddress, userAgent);
                        // videoSourceUrls.forEach(source => sse.send({videoSourceUrl: source, url, provider: 'http://estream.xyz'}, 'results'));

                    } else if (streamPageUrl.includes('vidzi.online')) {
                        // const sources = await Vidzi(streamPageUrl, jar, req.client.remoteAddress, userAgent);
                        // sources.forEach((source) => sse.send({videoSourceUrl: source.file, url, provider: 'https://vidzi.online'}, 'results'));

                    } else if (streamPageUrl.includes('vidto.me')) {
                        // console.log('Skipping vidto.me because the links are always broken.');

                    } else if (streamPageUrl.includes('vidup.me') || streamPageUrl.includes('vidup.tv') || streamPageUrl.includes('thevideo.me')) {
                        // console.log('Skipping vidup.me because captcha');

                    } else if (streamPageUrl.includes('vidtodo.me')) {
                        // const sources = await VidTodo(streamPageUrl, jar, req.client.remoteAddress, userAgent);
                        // sources.forEach(source => sse.send({videoSourceUrl: source.file, quality: source.label, url, provider: 'https://vidtodo.me'}, 'results'));

                    } else if (streamPageUrl.includes('powvideo.net')) {
                        // const path = streamPageUrl.split('/');
                        // const videoId = path[path.length - 1];
                        // const sources = await PowVideo(`https://povwideo.cc/iframe-${videoId}.html`, jar, req.client.remoteAddress, userAgent, videoId);
                        // sources.forEach(source => sse.send({videoSourceUrl: source.src, url, provider: 'https://powvideo.net'}, 'results'));

                    } else if (streamPageUrl.includes('streamplay.to')) {
                        // console.log('Skipping streamplay.to because captcha.');

                    } else if (streamPageUrl.includes('gamovideo.com')) {
                        // const sources = await GamoVideo(streamPageUrl, jar, req.client.remoteAddress, userAgent);
                        // sources.forEach(source => sse.send({videoSourceUrl: source.file, url, provider: 'http://gamovideo.com'}, 'results'));

                    } else {
                        console.log('Still need a resolver for', streamPageUrl);
                    }
                } catch(err) {
                    console.log(`No source found at ${streamPageUrl}`);
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
