const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function Openload(uri, jar, headers) {
    let providerPageHtml = await rp({
        uri,
        headers,
        jar,
        followAllRedirects: true,
        timeout: 5000
    });

    return OpenloadHtml(providerPageHtml, jar, headers);
}

function OpenloadHtml(providerPageHtml, jar, headers) {
    if (!providerPageHtml.includes("We can't find the file you are looking for")) {
        let $ = cheerio.load(providerPageHtml);

        let wholeFileId = '';
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
                click() {},
                hide() {},
            }
        };

        // starting variables
        let test = {}
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

    throw 'Openload: File not found';
}

module.exports = exports = {Openload, OpenloadHtml};