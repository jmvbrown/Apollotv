const Promise = require('bluebird');
const URL = require('url');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const randomUseragent = require('random-useragent');
const tough = require('tough-cookie');
const vm = require('vm');

const logger = require('../../../utils/logger')
const { padTvNumber } = require('../../../utils');
const resolve = require('../../resolvers/resolve');

async function Series8(req, sse) {
    const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '');
    const showTitle = req.query.title.toLowerCase();
    const {season, episode} = req.query;

    const urls = ['https://www2.seriesonline8.co'];
    const promises = [];

    const rp = RequestPromise.defaults(target => {
        if (sse.stopExecution) {
            return null;
        }

        return RequestPromise(target);
    });

    async function scrape(url) {
        const resolvePromises = [];

        try {
            var jar = rp.jar();
            const userAgent = randomUseragent.getRandom();
            const html = await rp({
                uri: `${url}/movie/search/${showTitle.replace(/\s+/g, '-')}`,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(html);

            const seasonLink = $('.ml-mask').toArray().find((moviePoster) => {
                if (moviePoster.type === 'tag' &&  moviePoster.name === 'a') {
                    const link = $(moviePoster).attr('href');
                    const title = showTitle.replace(/ /g, '-');
                    return link.includes(`${title}-season-${season}`);
                }
            });
            const seasonPageLink = `${url}${$(seasonLink).attr('href')}`;

            const episodeLink = `${seasonPageLink}/watching.html?ep=${episode}`;

            const episodePageHtml = await rp({
                uri: episodeLink,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            $ = cheerio.load(episodePageHtml);

            const videoUrls = $('.btn-eps').toArray().reduce((providerUrls, iframeLinks) => {
                if ($(iframeLinks).attr('title').toLowerCase().includes(`season ${season}`) && $(iframeLinks).attr('title').toLowerCase().includes(`episode ${padTvNumber(episode)}`)) {
                    providerUrls.push($(iframeLinks).attr('player-data'));
                }
                return providerUrls;
            }, []);

            videoUrls.forEach(async (provider) => {
                const headers = {
                    'user-agent': userAgent,
                    'x-real-ip': clientIp,
                    'x-forwarded-for': clientIp
                };
                resolvePromises.push(resolve(sse, provider, 'Series8', jar, headers));
            });
        } catch (err) {
            if (!sse.stopExecution) {
                console.error({source: 'Series8', sourceUrl: url, query: {title: req.query.title, season: req.query.season, episode: req.query.episode}, error: err.message || err.toString()});
            }
        }

        return Promise.all(resolvePromises);
    }

    urls.forEach((url) => {
        promises.push(scrape(url));
    })

    return Promise.all(promises);

}

module.exports = exports = Series8;