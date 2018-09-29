const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

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
            const html = await rp({
                uri: `${url}/search/${showTitle.replace(/ /, '%20').replace(/ \(.*\)/, '')}`,
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
                uri: `${url}/search/${showTitle.replace(/ /, '%20').replace(/ \(.*\)/, '')}`,
                timeout: 5000
            });

            $ = cheerio.load(videoPageHtml);

            let episodeUrl = '';
            $('.sinfo').some(element => {
                if ($(element).text() === `${season}x${episode}`) {
                    episodeUrl = `${url}${$(element).parent().attr('href')}`;
                    return true;
                }
                return false;
            });

            const episodePageHtml = await await rp({
                uri: episodeUrl,
                timeout: 5000
            });

            $ = cheerio.load(episodePageHtml);

            const videoUrls = [];

            $('.watch-btn').each(element => {
                videoUrls.push(`${url}${$(element).attr('href')}`);
            });

            videoUrls.forEach(async (videoUrl) => {
                const videoPageHtml = await await rp({
                    uri: videoUrl,
                    timeout: 5000
                });

                $ = cheerio.load(videoPageHtml);

                const streamPageUrl = $('.action-btn').attr('href');

                if (streamPageUrl.startsWith('https://openload.co')) {
                    // get the embed link and do what I do in AZMovies
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
