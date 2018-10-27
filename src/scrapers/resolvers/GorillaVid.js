const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function GorillaVid(uri, jar, clientIp, userAgent) {
    const videoSourceHtml = await rp({
        uri,
        headers: {
            'user-agent': userAgent
        },
        jar,
        followAllRedirects: true,
        timeout: 5000
    });

    let $ = cheerio.load(videoSourceHtml);

    const videoPageHtml = await rp({
        uri: uri.replace('http:', 'https:'),
        method: 'POST',
        headers: {
            'user-agent': userAgent
        },
        formData: $('form').serializeArray().reduce(function(m,o){ m[o.name] = o.value; return m;}, {}),
        jar,
        followAllRedirects: true,
        timeout: 5000
    });

    $ = cheerio.load(videoPageHtml);

    let videoOptions = {};
    const videojs = function(ignoreThis, options) {
        if (options) {
            videoOptions = options;
        }

        return {hotkeys(){}, ready(){}};
    }
    videojs.options = {flash: {}};
    const sandbox = {
        videojs,
        window: {location: {href: {match(){ return false; }}}}
    };
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script:contains("sources")')[0].children[0].data, sandbox);
    return videoOptions.sources;
}

module.exports = exports = GorillaVid;