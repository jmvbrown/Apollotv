const URL = require('url');
const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

async function Afdah(queryString, sse) {
    // Start up the headless browser in no-sandbox mode to make it truly headless
    const browser = await puppeteer.launch({args: ['--no-sandbox']});
    
    // These are all the same host I think. https://xmovies8.org isn't loading.
    const urls = ["https://afdah.org", "https://genvideos.com", "https://genvideos.co", "https://watch32hd.co", "https://putlockerhd.co", "https://xmovies8.org"];
    const promises = [];

    // Go to each url and scrape for links, then send the link to the client 
    async function scrape(url) {
        try {
            const html = await rp({
                uri: `${url}/results?q=${url === "https://watch32hd.co" ? queryString.replace(/ /, '+'): queryString}`,
                timeout: 5000
            });

            let $ = cheerio.load(html);
            let videoId = '';

            $('.cell').toArray().some(element => {
                const videoName = $(element).find('.video_title').text().trim();
                if (videoName === queryString) {
                    videoId = $(element).find('.video_title h3 a').attr('href').trim();
                    return true;
                }

                return false;
            });

            const videoPageHtml = await rp({
                uri: `${url}${videoId}`,
                timeout: 5000
            });

            const regexMatches = /(?:var frame_url = ")(.*)(?:")/g.exec(videoPageHtml);

            if (regexMatches.length === 2) {
                let videoStreamUrl = `https:${regexMatches[1]}`;

                const page = await browser.newPage();
                await page.goto(videoStreamUrl);
                await page.waitFor(() => !!document.querySelector('video').src);
                const videoSrc = await page.$eval('video', video => video.src);
                await page.close();
                const videoSourceUrl = URL.parse(videoSrc, true).query.url;
                
                sse.send({videoSourceUrl, provider: url}, 'results');
            }

            
        } catch (err) {
            console.log(err);
            if (err.cause && err.cause.code !== 'ETIMEDOUT') {
                console.error(err);
                sse.send({url, message: 'Looks like this provider is down.'}, 'error');
            }
        }
    }

    // Asyncronously start all the scrapers for each url
    urls.forEach((url) => {
        promises.push(scrape(url));
    })
    
    // Wait for all the scrapers to return before closing the browser
    await Promise.all(promises);
    await browser.close();
}

module.exports = exports = Afdah;