const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function Streamango(uri, jar, clientIp) {
    let providerPageHtml = await rp({
        uri,
        headers: {
            'x-real-ip': clientIp,
            'x-forwarded-for': clientIp
        },
        jar,
        timeout: 5000
    });

    $ = cheerio.load(providerPageHtml);

    let fileId = '';

    const jQuery = function(selector, anotherArg) {
        return {
            $(selector) {
                return $(selector);
            },
            ready(f) {
                f();
            },
            click() {},
            hide() {}
        }
    };

    // starting variables
    const sandbox = {
        $: jQuery,
        document: {},
        window: {},
    };
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script:contains(srces)')[0].children[0].data.replace('src:d(', 'src:window.d('), sandbox);

    return `https:${sandbox.srces[0].src}`;
}

module.exports = exports = Streamango;