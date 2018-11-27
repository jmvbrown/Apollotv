const Promise = require('bluebird');
const RequestPromise = require('request-promise');
const cheerio = require('cheerio');
const AES = require('crypto-js/aes');

const resolve = require('../../resolvers/resolve');
const {padTvNumber} = require('../../../utils');

async function AfdahTV(req, sse) {
    const clientIp = req.client.remoteAddress.replace('::ffff:', '').replace('::1', '');
    const title = req.query.title;
    const season = padTvNumber(req.query.season);
    const episode = padTvNumber(req.query.episode);

    const urls = ['https://afdah.to'];
    const promises = [];

    const rp = RequestPromise.defaults(target => {
        if (sse.stopExecution) {
            return null;
        }

        return RequestPromise(target);
    });

    async function scrape(url) {
        const resolvePromises = [];

        try {
            const headers = {
                'x-real-ip': clientIp,
                'x-forwarded-for': clientIp
            };
            const jar = rp.jar();
            const html = await rp({
                uri: `${url}/wp-content/themes/afdah/ajax-search2.php`,
                headers,
                method: 'POST',
                form: {
                    process: AES.encrypt(title + '|||' + 'title', "Watch Movies Online").toString()
                },
                jar,
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
                headers,
                jar,
                timeout: 5000
            });

            $ = cheerio.load(videoPageHtml);

            if($('#tabs').find('a[content="cont_1"]').text() === 'Watch TV') {
                const episodeUrl = $(`a[href*="s${season}e${episode}"]`).attr('href') || $(`a[href*="s${season}e0${episode}"]`).attr('href') || $(`a[href*="e${episode}"]`).attr('href') || $(`a[href*="e0${episode}"]`).attr('href');

                const videoPageHtml = await rp({
                    uri: `${url}${episodeUrl}`,
                    headers,
                    jar,
                    timeout: 5000
                });

                $ = cheerio.load(videoPageHtml);

                $('.jw-player')
                    .toArray()
                    .map(player => $(player).data().id)
                    .filter(serverUrl => !serverUrl.includes('trailer'))
                    .forEach(async (serverUrl) => {
                        const videoPageHtml = await rp({
                            uri: `${url}${serverUrl}`,
                            method: 'POST',
                            headers: {
                                'x-real-ip': req.client.remoteAddress,
                                'x-forwarded-for': req.client.remoteAddress
                            },
                            formData: {
                                play: 'continue',
                                x: 715,
                                y: 490
                            },
                            jar,
                            timeout: 5000
                        });

                        $ = cheerio.load(videoPageHtml);

                        // This one might be needed, but so far, salt has been used over decrypt

                        // const code = /decrypt\("([^"]+)/g.exec(videoPageHtml)[1];
                        // const decode = Buffer.from(tor(Buffer.from(code, 'base64').toString('ascii')), 'base64').toString('ascii');
                        // console.log(decode);
                        // urls = [(i[0], i[1]) for i in re.findall(
                        //     '''file\s*:\s*["']([^"']+)['"].+?label\s*:\s*["'](\d+)p["']''', str(decode), re.DOTALL)
                        //         if int(i[1]) >= 720]
                        // for i in urls:
                        //     url = i[0]
                        //     quality = i[1] + 'p'
                        //     sources.append(
                        //         {'source': 'GVIDEO', 'quality': quality, 'language': 'en', 'url': url,
                        //          'direct': True,
                        //          'debridonly': False})

                        const code = /salt\("([^"]+)/g.exec(videoPageHtml)[1];
                        let decode = tor(Buffer.from(tor(code), 'base64').toString('ascii'));
                        let providerRegex = /(?:src=')(.*)(?:' scrolling)/g.exec(decode);
                        if (providerRegex) {
                            resolvePromises.push(resolve(sse, providerRegex[1], 'AfdahTV', jar));
                        } else {
                            decode = Buffer.from(tor(Buffer.from(code, 'base64').toString('ascii')), 'base64').toString('ascii');
                            providerRegex = /(?:src=')(.*)(?:' scrolling)/g.exec(decode);
                            resolvePromises.push(resolve(sse, providerRegex[1], 'AfdahTV', jar));
                        }
                    });
            } else {
                // Not working because the stream is a peer-to-peer .m3u8 and I haven't found a player that will work.

    //             const page = await browser.newPage();
    //             await page.goto(`${url}${videoId}`);
    //             await page.waitFor('.jw-player');
    //             const sourceIds = await page.$$eval('.jw-player', serverTabs => serverTabs.map(serverTab => serverTab.dataset.id));
    //
    //             async function scrape(sourceId) {
    //                 await page.goto(`${url}${sourceId}`);
    //                 await page.waitFor('input[type="image"]');
    //                 await page.click('input[type="image"]');
    //                 await page.waitFor(5000);
    //                 const content = await page.content();
    //                 // await page.screenshot({path: 'AfdahTV.png'});
    //                 const videoSourceUrl = await page.evaluate(() => window.player && window.player.getPlaylist()[0].file);
    //                 console.log(videoSourceUrl);
    //                 sse.send({videoSourceUrl, url, provider}, 'result');
    //             }
    //
    //             sourceIds.filter(sourceId => !sourceId.startsWith('/trailer')).forEach(sourceId => {
    //                 promises.push(scrape(sourceId))
    //             });
            }
        } catch (err) {
            if (!sse.stopExecution) {
                console.error({source: 'AfdahTV', sourceUrl: url, query: {title: req.query.title, season: req.query.season, episode: req.query.episode}, error: err.message || err.toString()});
            }
        }

        return Promise.all(resolvePromises);
    }

    // Asyncronously start all the scrapers for each url
    urls.forEach((url) => {
        promises.push(scrape(url));
    });

    return Promise.all(promises);
}

function tor(txt) {
    try {
        let map = {};
        let tmp = "abcdefghijklmnopqrstuvwxyz";
        let buf = "";
        let j = 0;
        for (c of tmp) {
            let x = tmp[j];
            let y = tmp[(j + 13) % 26];
            map[x] = y;
            map[x.toUpperCase()] = y.toUpperCase();
            j += 1;
        }

        j = 0;
        for (let c of txt) {
            c = txt[j];
            if (c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z') {
                buf += map[c];
            } else {
                buf += c
            }
            j += 1
        }

        return buf;
    } catch(ignored) {}
}

module.exports = exports = AfdahTV;