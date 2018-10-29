const rp = require('request-promise');
const cheerio = require('cheerio');
const tough = require('tough-cookie');
const randomUseragent = require('random-useragent');

// const Openload = require('../../resolvers/Openload');
// const Streamango = require('../../resolvers/Streamango');
// const RapidVideo = require('../../resolvers/RapidVideo');
const resolve = require('../../resolvers/resolve');

async function AZMovies(req, sse) {
    const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '')
    const movieTitle = req.query.title;

    // These are all the same host I think. https://xmovies8.org isn't loading.
    const urls = ["https://azmovies.xyz"];
    const promises = [];

    // Go to each url and scrape for links, then send the link to the client
    async function scrape(url) {
        try {
            const jar = rp.jar();
            const movieUrl = `${url}/watch.php?title=${movieTitle.replace(/ /g, '+')}`;
            const referer = `https://azmovies.xyz/`;
            const userAgent = randomUseragent.getRandom();
            const headers = {
                referer,
                'user-agent': userAgent,
                'x-real-ip': clientIp,
                'x-forwarded-for': clientIp
            };

            let html = await rp({
                uri: movieUrl,
                headers,
                jar,
                followAllRedirects: true,
                timeout: 5000
            });

            let documentCookie = /document\.cookie\s*=\s*"(.*)=(.*)";/g.exec(html);
            while (documentCookie) {
                const cookie = new tough.Cookie({
                    key: documentCookie[1],
                    value: documentCookie[2]
                });
                jar.setCookie(cookie, url);
                html = html.replace('document.cookie', '');
                documentCookie = /document\.cookie\s*=\s*"(.*)=(.*)";/g.exec(html);
            }

            const videoPageHtml = await rp({
                uri: movieUrl,
                headers,
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(videoPageHtml);

            $('#serverul li a').toArray().forEach(async (element) => {
                const providerUrl = $(element).attr('href');
                resolve(sse, providerUrl, 'AZMovies', jar, headers);
            });
        } catch (err) {
            console.log(err);
        }
    }

    // Asyncronously start all the scrapers for each url
    urls.forEach((url) => {
        promises.push(scrape(url));
    });
}

module.exports = exports = AZMovies;