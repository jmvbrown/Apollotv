const rp = require('request-promise');
const cheerio = require('cheerio');
const tough = require('tough-cookie');
const randomUseragent = require('random-useragent');

const resolve = require('../../resolvers/resolve');

async function GoStream(req, sse) {
    const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '');
    const movieTitle = req.query.title;

    // These are all the same host I think. https://xmovies8.org isn't loading.
    const urls = ["https://gostream.site"];
    const promises = [];

    // Go to each url and scrape for links, then send the link to the client
    async function scrape(url) {
        try {
            const jar = rp.jar();
            const movieSearchUrl = `${url}/?s=${movieTitle.replace(/ /g, '+')}`;
            const userAgent = randomUseragent.getRandom();
            const headers = {
                'user-agent': userAgent,
                'x-real-ip': clientIp,
                'x-forwarded-for': clientIp
            };

            const searchPageHtml = await rp({
                uri: movieSearchUrl,
                headers,
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(searchPageHtml);

            const moviePageUrl = $(`a[oldtitle="${movieTitle}"]`).attr('href');

            const moviePageHtml = await rp({
                uri: moviePageUrl,
                headers,
                jar,
                timeout: 5000
            });

            $ = cheerio.load(moviePageHtml);

            const apiUrl = $('.movieplay iframe').attr('src');

            const apiPageHtml = await rp({
                uri: apiUrl,
                headers: {
                    Referer: moviePageUrl,
                    'user-agent': userAgent,
                    'cache-control': 'no-cache'
                },
                jar,
                timeout: 5000
            });

            $ = cheerio.load(apiPageHtml);

            const videoId = $('player').attr('video');
            const videoKey = $('player').attr('hash');
            const videoExpireTime = $('player').attr('expire');
            const response = await rp({
                uri: 'https://consistent.stream/api/getVideo',
                method: 'POST',
                body: {
                    expire: videoExpireTime,
                    key: videoKey,
                    referrer: moviePageUrl,
                    video: videoId
                },
                json: true,
                headers: {
                    Referer: apiUrl
                },
                jar,
                timeout: 5000
            });

            response.servers.forEach(server => server.sources.forEach(source => console.log(source.src)));
        } catch (err) {
            console.log(err);
        }
    }

    // Asyncronously start all the scrapers for each url
    urls.forEach((url) => {
        promises.push(scrape(url));
    });
}

module.exports = exports = GoStream;