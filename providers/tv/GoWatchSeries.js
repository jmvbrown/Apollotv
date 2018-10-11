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
    console.log(req.query)

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
                return link.includes(`${showTitle}-season-${season}`) || link.includes(`${showTitle.replace(' ', '-')}-season-${season}`)
            });
            const seasonPageLink = `${url}${$(seasonLink.parent).attr('href')}`
           
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
                    iframeSrc = `https:${child.attribs.src}`
                    iframeLinks.push(iframeSrc);
                }
            })

            iframeLinks.forEach(async(link) => {
                if (link.includes('openload.co')) {
                    const path = link.split('?');
                    console.log('path')
                    console.log(path)
                    const videoSourceUrl = await Openload(path[0], jar, req.client.remoteAddress);
                    console.log(videoSourceUrl)
                    sse.send({ videoSourceUrl, url, provider: 'https://openload.co', ipLocked: true }, 'results');                    
                } 
                // else if (link.includes('vidcloud.icu')) {
                //     const path = link.split('?')[1].split('=')[1];
                //     console.log(path)
                //     const videoId = path[path.length - 2];
                //     console.log('ID ', videoId)
                //     const videoSourceObject = await rp({
                //         uri: `https://vidcloud.icu/player?fid=${path}&page=video`,
                //         headers: {
                //             'user-agent': userAgent
                //         },
                //         jar,
                //         json: true,
                //         timeout: 5000
                //     });

                //     $ = cheerio.load(videoSourceObject.html);

                //     const sandbox = { jwplayer() { return { setup() { }, on() { }, addButton() { } } }, $() { } };
                //     vm.createContext(sandbox); // Contextify the sandbox.
                //     vm.runInContext($('script').last()[0].children[0].data, sandbox);

                //     const videoSourceUrl = sandbox.config.sources[0].file;

                //     sse.send({ videoSourceUrl, url, provider: 'https://vidcloud.co' }, 'results');
                // }
                else if (link.includes('rapidvideo')) {
                    const videoPageHtml = await rp({
                        uri: link,
                        headers: {
                            'user-agent': userAgent,
                            'x-real-ip': req.client.remoteAddress,
                            'x-forwarded-for': req.client.remoteAddress
                        },
                        jar,
                        timeout: 5000
                    });
                    $ = cheerio.load(videoPageHtml);
                    $('source').toArray().forEach((sourceElement) => {
                        sse.send({ videoSourceUrl: $(sourceElement).attr('src'), quality: $(sourceElement).attr('title'), url, provider: 'https://rapidvideo.com' }, 'results');
                    })
                }
                else if (link.includes('streamango')) {
                    const videoPageHtml = await rp({
                        uri: link,
                        headers: {
                            'user-agent': userAgent,
                            'x-real-ip': req.client.remoteAddress,
                            'x-forwarded-for': req.client.remoteAddress
                        },
                        jar,
                        timeout: 5000
                    });
                    $ = cheerio.load(videoPageHtml);
                    let setupObject = {};
                    const sandbox = { window: {}, setInterval() {}, jwplayer() { return { setup(value) { setupObject = value; }, on() { } } } };
                    vm.createContext(sandbox); // Contextify the sandbox.
                    vm.runInContext($('script:contains("p,a,c,k,e,d")')[0].children[0].data, sandbox);
                    console.log('----')
                    console.log(setupObject)
                    setupObject.sources.forEach((source) => {
                        console.log(source)
                        sse.send({ videoSourceUrl: source.file, url, provider: 'https://vidzi.online' }, 'results');
                    });
                    // console.log(videoPageHtml)
                    // $('video').toArray().forEach((sourceElement) => {
                    //     console.log($(sourceElement).attr('src'))
                    //     sse.send({ videoSourceUrl: $(sourceElement).attr('src'), quality: $(sourceElement).attr('title'), url, provider: 'https://streamango.com' }, 'results');
                    // })
                }
            })  

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