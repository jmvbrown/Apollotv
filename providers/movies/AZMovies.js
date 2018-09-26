const URL = require('url');
const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const tough = require('tough-cookie');
const randomUseragent = require('random-useragent');

const Openload = require('../../resolvers/Openload');
const Streamango = require('../../resolvers/Streamango');

async function AZMovies(req, sse) {
    const movieTitle = req.query.title;

    // Start up the headless browser in no-sandbox mode to make it truly headless
    const browser = await puppeteer.launch({args: ['--no-sandbox']});

    // These are all the same host I think. https://xmovies8.org isn't loading.
    const urls = ["https://azmovies.xyz"];
    const promises = [];

    // Go to each url and scrape for links, then send the link to the client
    async function scrape(url) {
        try {
            const jar = rp.jar();
            const movieUrl = `${url}/watch.php?title=${movieTitle.replace(/ /g, '+')}`;
            const referer = `${url}/check.php?url=${url}/watch.php?title=${movieTitle.replace(/ /g, '+')}`;
            const userAgent = randomUseragent.getRandom();

            const html = await rp({
                uri: movieUrl,
                headers: {
                    referer,
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                followAllRedirects: true,
                timeout: 5000
            });

            const documentCookie = /document\.cookie\s*=\s*"(.*)=(.*)";/g.exec(html);
            const cookie = new tough.Cookie({
                key: documentCookie[1],
                value: documentCookie[2]
            });
            jar.setCookie(cookie, url);

            const videoPageHtml = await rp({
                uri: movieUrl,
                headers: {
                    referer,
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(videoPageHtml);

            $('#serverul li a').toArray().forEach(async (element) => {
                const providerUrl = $(element).attr('href');
                if (providerUrl.startsWith('https://openload.co/embed')) {
                    // const videoSourceUrl = await Openload(providerUrl, jar, req.client.remoteAddress);
                    // sse.send({videoSourceUrl, url, provider: 'https://openload.co', ipLocked: true}, 'results');
                } else if (providerUrl.startsWith('https://streamango.com/embed')) {
                    // const videoSourceUrl = await Streamango(providerUrl, jar, req.client.remoteAddress);
                    // sse.send({videoSourceUrl, url, provider: 'https://streamango.com', ipLocked: true}, 'results');
                } else if (providerUrl.startsWith('https://files.azmovies.co')) {
                    const videoPageHtml = await rp({
                        uri: providerUrl,
                        headers: {
                            referer,
                            'user-agent': userAgent,
                            'x-real-ip': req.client.remoteAddress,
                            'x-forwarded-for': req.client.remoteAddress
                        },
                        jar,
                        timeout: 5000
                    });

                    const videoSrcUrl = /(?:src: ')(.*)(?:')/g.exec(videoPageHtml)[1];
                    const videoStreamFileUrl = `https://files.azmovies.co/${videoSrcUrl}`;
                    const videoStreamFile = await rp({
                        uri: videoStreamFileUrl,
                        headers: {
                            referer,
                            'user-agent': userAgent,
                            'x-real-ip': req.client.remoteAddress,
                            'x-forwarded-for': req.client.remoteAddress
                        },
                        jar,
                        timeout: 5000
                    });

                    const streamUrl = videoStreamFileUrl.substr(0, videoStreamFileUrl.lastIndexOf('/') + 1);
                    const m3u8File = Buffer.from(videoStreamFile.replace(/az\d\d\d\.ts/g, `${streamUrl}$&`)).toString('base64');

                    sse.send({m3u8File, url, provider: 'https://files.azmovies.co'}, 'results');
                }
            });
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

module.exports = exports = AZMovies;