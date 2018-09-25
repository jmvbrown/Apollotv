const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function Openload(uri, jar) {
    let providerPageHtml = await rp({
        uri,
        jar,
        timeout: 5000
    });

    $ = cheerio.load(providerPageHtml);

    const fileid = /(?:>window.fileid=")(.*)(?:";)/g.exec(providerPageHtml)[1];
    let wholeFileId = ''
    const jQuery = function(selector, anotherArg) {
        return {
            $(selector) {
                return $(selector);
            },
            ready(f) {
                f();
            },
            text(t) {
                if (!t) {
                    return $('p').first().text();
                }
                wholeFileId = t;
            },
            click() {}
        }
    };

    // starting variables
    const sandbox = {
        $: jQuery,
        jQuery,
        document: {
            createTextNode: "function createTextNode() { [native code] }",
            getElementById: "function getElementById() { [native code] }",
            write: "function write() { [native code] }",
            documentElement: {
                getAttribute(attribute) {
                    return null;
                }
            }
        },
        window: {
        },
        sin: Math.sin,
        navigator: {
            userAgent: ''
        },
        ffff: $('p').first().attr('id')
    };
    vm.createContext(sandbox); // Contextify the sandbox.
    vm.runInContext($('script').last()[0].children[0].data, sandbox);

    return `https://openload.co/stream/${wholeFileId}?mime=true`;
}

module.exports = exports = Openload;