const rp = require('request-promise');
const cheerio = require('cheerio');
const vm = require('vm');

async function VidTodo(uri, jar, {userAgent}) {
    const videoSourceHtml = await rp({
        uri,
        headers: {
            'user-agent': userAgent
        },
        jar,
        timeout: 5000
    });
    const videoSourcesString = /(?:sources:\s)(\[.*\])/g.exec(videoSourceHtml)[1];
    const sandbox = {};
    vm.createContext(sandbox); // Contextify the sandbox.
    return vm.runInContext(videoSourcesString, sandbox);
}

module.exports = exports = VidTodo;