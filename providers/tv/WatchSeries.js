const URL = require('url');
const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

async function WatchSeries(req, sse) {
    console.log(req.query)
    const showTitle = req.query.title;
    const {season, episode} = req.query

    // These providers were in the Terarium source, but are now dead..... We need to find others
    //, "https://seriesfree1.bypassed.bz"]//, "https://seriesfree1.bypassed.eu", "https://seriesfree1.bypassed.bz"];

    const urls = ["https://seriesfree.to"]
    const promises = [];
    let browser;

    // Go to each url and scrape for links, then send the link to the client 
    async function scrape(url) {
        try {
            let $ = await _loadPageWithCheerio(`${url}/search/${showTitle.replace(/ /, '%20')}`)
            let serieLink;
            $('.separate').toArray().some(element => {
                let serieResult = $(element).find('.poster').attr('href');
                let title = $(element).find('.poster').attr('title');
                if (_isSerieFound(showTitle, serieResult, title)) {
                    serieLink = `${url}${serieResult}`
                    return true;
                }
                return false;
            })
            
            let seasonLinks = [], episodeLinks = [];

            let videoPageParsed = await _loadPageWithCheerio(serieLink)
            videoPageParsed('div[itemtype="http://schema.org/TVSeason"]').each((i, el) => {
                const seasonLink = videoPageParsed(el).find('.heading-sm').find('a').attr('href')
                seasonLinks.push(`${url}${seasonLink}`);
            })

            videoPageParsed('li[itemtype="http://schema.org/TVEpisode"]').each((i, el) => {
                const episodeLink = videoPageParsed(el).find('a').attr('href');
                episodeLinks.push(`${url}${episodeLink}`)
            })
            const test = episodeLinks.filter((link) => {
                return link.includes(`s${season}_e${episode}`)
            })

            let allLinks = [];
            let t = await _loadPageWithCheerio(test)
            t('.watch-btn').each((i, el) => {
                const link = `${url}${t(el).attr('href')}`
                allLinks.push(link)
            })
            allLinks = allLinks.splice(0, 20)

            let streamPageLinks = [];
            allLinks.forEach(async (link) => {
                const videoPage = await _loadPageWithCheerio(link)
                const streamPageLink = videoPage('.action-btn').attr('href')
                let page;

                try {
                    browser = await puppeteer.launch({ args: ['--no-sandbox'] });
                    page = await browser.newPage();
                    await page.goto(streamPageLink);
                    await page.waitFor('.vjs-big-play-button', { timeout: 2000 });
                    await page.click('.vjs-big-play-button')
                    await page.waitFor(() => !!document.querySelector('video').src, );
                    const videoSrc = await page.$eval('video', video => video.src);
                    sse.send({ videoSrc, provider: url, show: `${showTitle}, s${season}_e${episode}` }, 'results');
                    
                } catch (err)  {
                    if (err.message.includes('timeout')) {
                        console.log(`${streamPageLink} has been taken down`)
                    }
                } finally {
                    browser.close()
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

const _loadPageWithCheerio = async (url) => {
    const html = await rp({
        uri: `${url}`,
        timeout: 6000
    });
    return cheerio.load(html);
}

const _isSerieFound = (queryString, serieResult, serieTitle) => {
    return (
        serieResult && (serieResult.trim().includes('/serie/') || serieTitle.trim().toLowerCase().includes(queryString.toLowerCase())))
}

module.exports = exports = WatchSeries;
