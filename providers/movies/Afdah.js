const URL = require('url');
const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const tough = require('tough-cookie');
const randomUseragent = require('random-useragent');

async function Afdah(req, sse) {
    const movieTitle = req.query.title;

    // Start up the headless browser in no-sandbox mode to make it truly headless
    const browser = await puppeteer.launch({args: ['--no-sandbox']});

    // These are all the same host I think. https://xmovies8.org isn't loading.
    const urls = ["https://afdah.org", "https://genvideos.com", "https://genvideos.co", "https://watch32hd.co", "https://putlockerhd.co", "https://xmovies8.org"];
    const promises = [];

    // Go to each url and scrape for links, then send the link to the client
    async function scrape(url) {
        try {
            const usePlus = url === "https://putlockerhd.co"
            const html = await rp({
                uri: `${url}/results?q=${usePlus ? movieTitle.replace(/ /, '+'): movieTitle}`,
                timeout: 5000
            });

            let $ = cheerio.load(html);
            let videoId = '';

            $('.cell').toArray().some(element => {
                const videoName = $(element).find('.video_title').text().trim();
                if (videoName === movieTitle) {
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

                var jar = rp.jar();
                const videoPageHtml = await rp({
                    uri: videoStreamUrl,
                    jar,
                    timeout: 5000
                });

                // const userAgent = randomUseragent.getRandom();
                const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36 OPR/55.0.2994.44';

                const postID = /(?:var postID = ')(.*)(?:';)/.exec(videoPageHtml)[1];
                const viewData = await rp({
                    uri: 'https://vidlink.org/embed/update_views',
                    method: 'POST',
                    formData: {},
                    headers: {
                        accept: 'application/json, text/javascript, */*; q=0.01',
                        'content-length': 0,
                        'accept-language': 'en-US,en;q=0.9',
                        // 'accept-encoding': 'gzip, deflate, br',
                        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        dnt: 1,
                        origin: 'https://vidlink.org',
                        referer: videoStreamUrl,
                        'save-data': 'on',
                        'user-agent': userAgent,
                        'x-requested-with': 'XMLHttpRequest'
                    },
                    jar,
                    gzip: true,
                    json: true,
                    timeout: 5000
                });
                const id_view = viewData.id_view;

                const obfuscatedSources = await rp({
                    uri: 'https://vidlink.org/streamdrive/info',
                    method: 'POST',
                    headers: {
                        accept: 'text/html, */*; q=0.01',
                        'accept-language': 'en-US,en;q=0.9',
                        // 'accept-encoding': 'gzip, deflate, br',
                        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        dnt: 1,
                        origin: 'https://vidlink.org',
                        referer: videoStreamUrl,
                        'save-data': 'on',
                        'user-agent': userAgent,
                        'x-requested-with': 'XMLHttpRequest'
                    },
                    formData: {
                        browserName: 'Opera',
                        platform: 'Linux x86_64',
                        postID,
                        id_view
                    },
                    gzip: true,
                    timeout: 5000
                });

                var cleanedObfuscatedSources = obfuscatedSources
                    .replace('return(c35?String', `return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String`)
                    .replace(/\\/g, '\\\\');


                const vm = require('vm');
                const sandbox = {window: {checkSrc: function(){}}}; // starting variables
                vm.createContext(sandbox); // Contextify the sandbox.
                vm.runInContext(cleanedObfuscatedSources, sandbox);
                videoSourceUrl = sandbox.window.srcs[0].url;

//                 await rp({
//                     uri: videoSourceUrl,
//                     method: 'OPTIONS',
//                     headers: {
//                         accept: 'text/html, */*; q=0.01',
//                         'accept-language': 'en-US,en;q=0.9',
//                         // 'accept-encoding': 'gzip, deflate, br',
//                         'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
//                         dnt: 1,
//                         origin: 'https://vidlink.org',
//                         referer: videoStreamUrl,
//                         'save-data': 'on',
//                         'user-agent': userAgent,
//                         'x-requested-with': 'XMLHttpRequest'
//                     },
//                     timeout: 5000
//                 });
//
//                 await rp({
//                     uri: videoSourceUrl,
//                     method: 'HEAD',
//                     headers: {
//                         accept: 'text/html, */*; q=0.01',
//                         'accept-language': 'en-US,en;q=0.9',
//                         // 'accept-encoding': 'gzip, deflate, br',
//                         'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
//                         dnt: 1,
//                         origin: 'https://vidlink.org',
//                         referer: videoStreamUrl,
//                         'save-data': 'on',
//                         'user-agent': userAgent,
//                         'x-requested-with': 'XMLHttpRequest'
//                     },
//                     timeout: 5000
//                 });

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