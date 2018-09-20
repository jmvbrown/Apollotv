const URL = require('url');
const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const AES = require("crypto-js/aes");

const padTvNumbers = require("../../utils/padTvNumbers");

async function Afdah(req, sse) {
    // Start up the headless browser in no-sandbox mode to make it truly headless
    const browser = await puppeteer.launch({args: ['--no-sandbox']});

    const title = req.query.title;
    const season = padTvNumbers(req.query.season);
    const episode = padTvNumbers(req.query.episode);

    const url = 'https://afdah.to';
    const promises = [];

    try {
        const html = await rp({
            uri: `${url}/wp-content/themes/afdah/ajax-search2.php`,
            method: 'POST',
            form: {
                process: AES.encrypt(title + '|||' + 'title', "Watch Movies Online").toString()
            },
            timeout: 5000
        });

        let $ = cheerio.load(html);
        let videoId = '';

        $('a').toArray().some(element => {
            const videoName = $(element).text();
            if (videoName === title) {
                videoId = $(element).attr('href');
                return true;
            }

            return false;
        });

        const videoPageHtml = await rp({
            uri: `${url}${videoId}`,
            timeout: 5000
        });

        $ = cheerio.load(videoPageHtml);

        if($('#tabs').find('a[content="cont_1"]').text() === 'Watch TV') {
            const episodeUrl = $(`a[href*="s${season}e${episode}"]`).attr('href') || $(`a[href*="s${season}e0${episode}"]`).attr('href') || $(`a[href*="e${episode}"]`).attr('href') || $(`a[href*="e0${episode}"]`).attr('href');

            const page = await browser.newPage();
            await page.goto(`${url}${episodeUrl}`);
            await page.waitFor('.jw-player');
            const videoSrc = await page.$eval('.jw-player', player => player.dataset.id);
            await page.goto(`${url}${videoSrc}`);
            await page.waitFor('input[type="image"]');
            await page.click('input[type="image"]');
            await page.waitFor('iframe');
            const videoProviderUrl = await page.$eval('iframe', iframe => iframe.src);
            await page.goto(videoProviderUrl);
            const videoProviderHtml = await page.content();
            const fileid = await page.evaluate(() => window.fileid);
            await page.close();

            $ = cheerio.load(videoProviderHtml);

            const streamId = $(`:contains("${fileid}")`).last().text();
            const providerObject = URL.parse(videoProviderUrl);
            const provider = `${providerObject.protocol}//${providerObject.host}`;
            const videoSourceUrl = `${provider}/stream/${streamId}`;
            sse.send({videoSourceUrl, url, provider}, 'results');
        } else {
            const page = await browser.newPage();
            await page.goto(`${url}${videoId}`);
            await page.waitFor('.jw-player');
            const sourceIds = await page.$$eval('.jw-player', serverTabs => serverTabs.map(serverTab => serverTab.dataset.id));

            async function scrape(sourceId) {
                await page.goto(`${url}${sourceId}`);
                await page.waitFor('input[type="image"]');
                await page.click('input[type="image"]');
                await page.waitFor(5000);
                const content = await page.content();
                // await page.screenshot({path: 'AfdahTV.png'});
                const videoSourceUrl = await page.evaluate(() => window.player && window.player.getPlaylist()[0].file);
                console.log(videoSourceUrl);
                sse.send({videoSourceUrl, url, provider}, 'results');
            }

            sourceIds.filter(sourceId => !sourceId.startsWith('/trailer')).forEach(sourceId => {
                promises.push(scrape(sourceId))
            });
        }
    } catch (err) {
        console.log(err);
        if (err.cause && err.cause.code !== 'ETIMEDOUT') {
            console.error(err);
            sse.send({url, message: 'Looks like this provider is down.'}, 'error');
        }
    }

    // Wait for all the scrapers to return before closing the browser
    await Promise.all(promises);
    await browser.close();
}

module.exports = exports = Afdah;