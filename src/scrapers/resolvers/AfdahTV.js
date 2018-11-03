const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function AfdahTV(uri, jar, headers) {
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
    const decode = tor(Buffer.from(tor(code), 'base64').toString('ascii'));
    const providerUrl = /(?:src=')(.*)(?:' scrolling)/g.exec(decode)[1];

    const videoSourceUrl = await Openload(providerUrl, jar);
    sse.send({videoSourceUrl, url, provider: 'https://openload.co', ipLocked: true}, 'result');
}

module.exports = exports = AfdahTV;