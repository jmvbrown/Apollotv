const URL = require('url');
const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const randomUseragent = require('random-useragent');
const tough = require('tough-cookie');
const vm = require('vm');

const resolve = require('../../resolvers/resolve');

async function GoWatchSeries(req, sse) {
    const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '')        
    const showTitle = req.query.title.toLowerCase();
    const { season, episode } = req.query;

    const urls = ['https://gowatchseries.co'];
    const promises = [];


    async function scrape(url) {
        try {
            var jar = rp.jar();
            const userAgent = randomUseragent.getRandom();

            const html = await rp({
                uri: `${url}/search.html?keyword=${showTitle.replace(/ /, '%20')}`,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(html);

            const seasonLinks = []
            const seasonLink = $('.hover_watch').toArray().find((moviePoster) => {
                const link = $(moviePoster.parent).attr('href');
                const title = showTitle.replace(/ /g, '-');
                return link.includes(`${title}-season-${season}`);
            });
            const seasonPageLink = `${url}${$(seasonLink.parent).attr('href')}`

            const seasonPageHtml = await rp({
                uri: `${seasonPageLink}`,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            $ = cheerio.load(seasonPageHtml);
            const episodePageLink = $('.child_episode').toArray().find((e) => {
                const link = $(e).find('a').attr('href');
                return link.includes(`episode-${episode}`)
            })
            const episodeLink = `${url}${$(episodePageLink).find('a').attr('href')}`;

            const episodePageHtml = await rp({
                uri: `${episodeLink}`,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            $ = cheerio.load(episodePageHtml);
            const videoDiv = $('.play-video');
            const otherVideoLinks = $('.anime_muti_link');
            const iframeLinks = [];

            otherVideoLinks.children().toArray().forEach((c) => {
                if (c.name === 'ul') {
                    c.children.forEach((t) => {
                        if (t.name === 'li') {
                            iframeLinks.push(t.attribs['data-video'])
                        }
                    })
                }
            })

            let iframeSrc;
            videoDiv.children().toArray().forEach((child) => {
                if (child.name === 'iframe') {
                    iframeSrc = `https:${child.attribs.src}`
                    iframeLinks.push(iframeSrc);
                }
            })

            iframeLinks.forEach(async (provider) => {
                const headers = {
                    'user-agent': userAgent,
                    'x-real-ip': clientIp,
                    'x-forwarded-for': clientIp
                };
                resolve(sse, provider, 'GoWatchSeries', jar, headers);
            });
        } catch (e) {
            console.error(err);
            if (err.cause && err.cause.code !== 'ETIMEDOUT') {
                console.error(err);
                sse.send({ url, message: 'Looks like this provider is down.' }, 'error');
            }
        }

    }
    urls.forEach((url) => {
        promises.push(scrape(url));
    })

    await Promise.all(promises);

}

module.exports = exports = GoWatchSeries;