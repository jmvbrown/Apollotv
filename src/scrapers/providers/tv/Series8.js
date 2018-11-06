const URL = require('url');
const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const randomUseragent = require('random-useragent');
const tough = require('tough-cookie');
const vm = require('vm');

const logger = require('../../utils/logger')

const Openload = require('../../resolvers/Openload');

async function GoWatchSeries(req, sse) {
    const showTitle = req.query.title.toLowerCase();
    const { season, episode } = req.query;

    const urls = ['https://www2.seriesonline8.co'];
    const promises = [];


    async function scrape(url) {
        try {
            var jar = rp.jar();
            const userAgent = randomUseragent.getRandom();
            console.log(`${url}/movie/search/${showTitle.replace(/\s+/g, '-')}`,)
            const html = await rp({
                uri: `${url}/movie/search/${showTitle.replace(/\s+/g, '-')}`,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(html);

            const seasonLink = $('.ml-mask').toArray().find((moviePoster) => {
                if (moviePoster.type === 'tag' &&  moviePoster.name === 'a'){
                    console.log($(moviePoster).attr('href'))
                    const link = $(moviePoster).attr('href');
                    const title = showTitle.replace(/ /g, '-');
                    return link.includes(`${title}-season-${season}`);
                }
            });
            const seasonPageLink = `${url}${$(seasonLink).attr('href')}`

            const episodeLink = `${seasonPageLink}/watching.html?ep=${episode}`
            console.log(episodeLink)
            
            const episodePageHtml = await rp({
                uri: episodeLink,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            $ = cheerio.load(episodePageHtml);

            const episodeLinks = $('.btn-eps').toArray().forEach((e) => {
                // console.log(e)
                console.log($(e).attr('player-data'))
                // const link = $(e).find('a').attr('href');
                // return link.includes(`episode-${episode}`)
            })
            // const episodeLink = `${url}${$(episodePageLink).find('a').attr('href')}`;

            // const episodePageHtml = await rp({
            //     uri: `${episodeLink}`,
            //     headers: {
            //         'user-agent': userAgent,
            //         'x-real-ip': req.client.remoteAddress,
            //         'x-forwarded-for': req.client.remoteAddress
            //     },
            //     jar,
            //     timeout: 5000
            // });

            // $ = cheerio.load(episodePageHtml);
            // const videoDiv = $('.play-video');
            // const otherVideoLinks = $('.anime_muti_link');
            // const iframeLinks = [];

            // otherVideoLinks.children().toArray().forEach((c) => {
            //     if (c.name === 'ul') {
            //         c.children.forEach((t) => {
            //             if (t.name === 'li') {
            //                 iframeLinks.push(t.attribs['data-video'])
            //             }
            //         })
            //     }
            // })

            // let iframeSrc;
            // videoDiv.children().toArray().forEach((child) => {
            //     if (child.name === 'iframe') {
            //         iframeSrc = `https:${child.attribs.src}`
            //         iframeLinks.push(iframeSrc);
            //     }
            // })

            // iframeLinks.forEach(async (link) => {
            //     if (link.includes('openload.co')) {
            //         const path = link.split('?');
            //         const videoSourceUrl = await Openload(path[0], jar, req.client.remoteAddress);
            //         sse.send({ videoSourceUrl, url, provider: 'https://openload.co', ipLocked: true }, 'results');
            //     }
            //     else if (link.includes('vidcloud.icu')) {
            //         // const path = link.split('?')[1].split('=')[1];
            //         // console.log('PATH: ', path)
            //         // const videoSourceObject = await rp({
            //         //     uri: `https://vidcloud.icu/streaming.php?id=${path}&page=video`,
            //         //     headers: {
            //         //         'user-agent': userAgent
            //         //     },
            //         //     jar,
            //         //     json: true,
            //         //     timeout: 5000
            //         // });

            //         // $ = cheerio.load(videoSourceObject.html);

            //         // const sandbox = { jwplayer() { return { setup() { }, on() { }, addButton() { } } }, $() { } };
            //         // vm.createContext(sandbox); // Contextify the sandbox.
            //         // vm.runInContext($('script').last()[0].children[0].data, sandbox);

            //         // const videoSourceUrl = sandbox.config.sources[0].file;

            //         // sse.send({ videoSourceUrl, url, provider: 'https://vidcloud.co' }, 'results');
            //         console.log('TODO: Fix VidCloud for GoWatchSeries');
            //     }
            //     else if (link.includes('rapidvideo')) {
            //         const videoPageHtml = await rp({
            //             uri: link,
            //             headers: {
            //                 'user-agent': userAgent,
            //                 'x-real-ip': req.client.remoteAddress,
            //                 'x-forwarded-for': req.client.remoteAddress
            //             },
            //             jar,
            //             timeout: 5000
            //         });
            //         $ = cheerio.load(videoPageHtml);
            //         $('source').toArray().forEach((sourceElement) => {
            //             sse.send({ videoSourceUrl: $(sourceElement).attr('src'), quality: $(sourceElement).attr('title'), url, provider: 'https://rapidvideo.com' }, 'results');
            //         })
            //     }
            //     else if (link.includes('streamango')) {
            //         // const videoPageHtml = await rp({
            //         //     uri: link,
            //         //     headers: {
            //         //         'user-agent': userAgent,
            //         //         'x-real-ip': req.client.remoteAddress,
            //         //         'x-forwarded-for': req.client.remoteAddress
            //         //     },
            //         //     jar,
            //         //     timeout: 5000
            //         // });
            //         // $ = cheerio.load(videoPageHtml);
            //         // let setupObject = {};
            //         // const sandbox = { window: {}, setInterval() { }, jwplayer() { return { setup(value) { setupObject = value; }, on() { } } } };
            //         // vm.createContext(sandbox); // Contextify the sandbox.
            //         // vm.runInContext($('script:contains("p,a,c,k,e,d")')[0].children[0].data, sandbox);
            //         // setupObject.sources.forEach((source) => {
            //         //     sse.send({ videoSourceUrl: source.file, url, provider: 'https://streamango.com' }, 'results');
            //         // });
            //         console.log('TODO: Fix Streamandgo for GoWatchSeries');
            //     }
            // });
        } catch (e) {
            console.log(e)
        }

    }
    urls.forEach((url) => {
        promises.push(scrape(url));
    })

    await Promise.all(promises);

}

module.exports = exports = GoWatchSeries;