const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');

const Openload = require('../../resolvers/Openload');

async function WatchSeries(req, sse) {
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

            const episodePageHtml = await await rp({
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
                    const videoPageHtml = await await rp({
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
                        const videoSourceHtml = await await rp({
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
                        videoSourceUrls.forEach(videoSourceUrl => sse.send({videoSourceUrl, url, provider: 'https://vidlox.me'}, 'results'))
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
    })

    // Wait for all the scrapers to return before closing the browser
    await Promise.all(promises);
}

module.exports = exports = WatchSeries;
