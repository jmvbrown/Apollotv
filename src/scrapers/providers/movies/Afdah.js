const rp = require('request-promise');
const cheerio = require('cheerio');
const randomUseragent = require('random-useragent');

const resolve = require('../../resolvers/resolve');

async function Afdah(req, sse) {
    const movieTitle = req.query.title;

    // These are all the same host I think. https://xmovies8.org isn't loading.
    const urls = ["https://afdah.org", "https://genvideos.com", "https://genvideos.co", "https://watch32hd.co", "https://putlockerhd.co", "https://xmovies8.org"];
    const promises = [];

    // Go to each url and scrape for links, then send the link to the client
    async function scrape(url) {
        try {
            let html = '';

            try {
                html = await rp({
                    uri: `${url}/results?q=${movieTitle.toLowerCase().replace(/ /g, '%20').replace(/\:/g, '')}`,
                    timeout: 5000
                });
            } catch(err) {
                try {
                    html = await rp({
                        uri: `${url}/results?q=${movieTitle.toLowerCase().replace(/ /g, '+').replace(/\:/g, '')}`,
                        timeout: 5000
                    });
                } catch(err) {
                    html = await rp({
                        uri: `${url}/results?q=${movieTitle.toLowerCase().replace(/ /g, '%2B').replace(/\:/g, '')}`,
                        timeout: 5000
                    });
                }
            }

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

                const jar = rp.jar();
                const videoPageHtml = await rp({
                    uri: videoStreamUrl,
                    jar,
                    timeout: 5000
                });

                const userAgent = randomUseragent.getRandom();

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
                    jar,
                    timeout: 5000
                });

                const cleanedObfuscatedSources = obfuscatedSources.replace('return(c35?String', `return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String`);

                try {
                    const vm = require('vm');
                    const sandbox = {window: {checkSrc: function(){}}}; // starting variables
                    vm.createContext(sandbox); // Contextify the sandbox.
                    vm.runInContext(cleanedObfuscatedSources, sandbox);

                    const link = sandbox.window.srcs[0].url;
                    const event = createEvent(link, false, {}, '', 'Vidlink', 'Afdah');
                    sse.send(event, event.event);
                } catch(err) {
                    const openloadData = await rp({
                        uri: ' https://vidlink.org/opl/info',
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
                            postID,
                        },
                        jar,
                        json: true,
                        timeout: 5000
                    });

                    const headers = {
                        'user-agent': userAgent,
                    };
                    const providerUrl = `https://oload.cloud/embed/${openloadData.id}`;

                    resolve(sse, providerUrl, 'Afdah', jar, headers);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Asyncronously start all the scrapers for each url
    urls.forEach((url) => {
        promises.push(scrape(url));
    });
}

module.exports = exports = Afdah;