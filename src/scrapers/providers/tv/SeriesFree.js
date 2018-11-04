const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');
const vm = require('vm');

const resolve = require('../../resolvers/resolve');

async function SeriesFree(req, sse) {
    const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '');
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
                    'user-agent': userAgent
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
                    'user-agent': userAgent
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
                    'user-agent': userAgent
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
                        'user-agent': userAgent
                    },
                    jar,
                    timeout: 5000
                });

                $ = cheerio.load(videoPageHtml);

                const providerUrl = $('.action-btn').attr('href');

                const headers = {
                    'user-agent': userAgent,
                    'x-real-ip': clientIp,
                    'x-forwarded-for': clientIp
                };
                resolve(sse, providerUrl, 'SeriesFree', jar, headers);
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
