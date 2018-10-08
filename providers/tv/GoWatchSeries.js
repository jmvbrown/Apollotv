const URL = require('url');
const Promise = require('bluebird');
const rp = require('request-promise');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const randomUseragent = require('random-useragent');

const logger = require('../../utils/logger')

const Openload = require('../../resolvers/Openload');

async function GoWatchSeries(req, sse) {
    const showTitle = req.query.title;
    const { season, episode } = req.query;
    console.log(season)

    const urls = ['https://gowatchseries.co'];
    const promises = [];
    

    async function scrape(url) {
        try {
            var jar = rp.jar();
            const userAgent = randomUseragent.getRandom();

            const html = await rp({
                uri: `${url}/search.html?keyword=${showTitle.replace(/ /, '%20')}`,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            let $ = cheerio.load(html);

            const seasonLinks = []
            const seasonLink = $('.hover_watch').toArray().find((moviePoster) => {
                const link = $(moviePoster.parent).attr('href');
                return link.includes(`${showTitle}-season-${season}`)
            });
            const seasonPageLink = `${url}${$(seasonLink.parent).attr('href')}`
            console.log(seasonPageLink)
           
            const seasonPageHtml = await rp({
                uri: `${seasonPageLink}`,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });

            $ = cheerio.load(seasonPageHtml);
            const episodePageLink = $('.child_episode').toArray().find((e) => {
                const link = $(e).find('a').attr('href');
                return link.includes(`episode-${episode}`)
            })
            const episodeLink = `${url}${$(episodePageLink).find('a').attr('href')}`;

            const episodePageHtml = await rp({
                uri: `${episodeLink}`,
                headers: {
                    'user-agent': userAgent,
                    'x-real-ip': req.client.remoteAddress,
                    'x-forwarded-for': req.client.remoteAddress
                },
                jar,
                timeout: 5000
            });
            
            $ = cheerio.load(episodePageHtml);
            const videoDiv = $('.play-video');
            const otherVideoLinks = $('.anime_muti_link');
            const iframeLinks = [];
            
            otherVideoLinks.children().toArray().forEach((c) => {
                if (c.name === 'ul') {
                    c.children.forEach((t) => {
                        if (t.name === 'li') {
                            iframeLinks.push(t.attribs['data-video'])
                        }
                    })
                }
            })

            let iframeSrc;
            videoDiv.children().toArray().forEach((child) => {
                if(child.name === 'iframe') {
                    // console.log(child);
                    iframeSrc = `https:${child.attribs.src}`
                    iframeLinks.push(iframeSrc);
                    // console.log(x);
                }
            })

            iframeLinks.forEach(async(link) => {
                // if (link.includes('openload.co')) {
                //     const path = link.split('/');
                //     console.log('path')
                //     console.log(path)
                //     const videoSourceUrl = await Openload(link, jar, req.client.remoteAddress);
                //     sse.send({ videoSourceUrl, url, provider: 'https://openload.co', ipLocked: true }, 'results');                    
                // } else 
                if (link.includes('vidcloud.icu')) {
                    const path = link.split('/');
                    const videoId = path[path.length - 2];
                    console.log('ID ', videoId)
                    const videoSourceObject = await rp({
                        uri: `https://vidcloud.co/player?fid=${videoId}&page=video`,
                        headers: {
                            'user-agent': userAgent
                        },
                        jar,
                        json: true,
                        timeout: 5000
                    });

                    $ = cheerio.load(videoSourceObject.html);

                    const sandbox = { jwplayer() { return { setup() { }, on() { }, addButton() { } } }, $() { } };
                    vm.createContext(sandbox); // Contextify the sandbox.
                    vm.runInContext($('script').last()[0].children[0].data, sandbox);

                    const videoSourceUrl = sandbox.config.sources[0].file;

                    sse.send({ videoSourceUrl, url, provider: 'https://vidcloud.co' }, 'results');
                }
            })

            // const test = await rp({
            //     uri: `${iframeSrc}`,
            //     headers: {
            //         // 'user-agent': userAgent,
            //         // 'x-real-ip': req.client.remoteAddress,
            //         // 'x-forwarded-for': req.client.remoteAddress
            //     },
            //     jar,
            //     timeout: 5000
            // })

            console.log('links');
            console.log(iframeLinks);

        } catch (e) {
            console.log(e)
        }

    }
    urls.forEach((url) => {
        promises.push(scrape(url));
    })

    await Promise.all(promises);

}

// const test = {
//     query: {
//         season: 6,
//         episode: 8,
//         title: 'suits'
//     }
// }

// GoWatchSeries(test, {})

module.exports = exports = GoWatchSeries;