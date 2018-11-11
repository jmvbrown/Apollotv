const {Openload} = require('./Openload');
const {Streamango} = require('./Streamango');
const RapidVideo = require('./RapidVideo');
const AZMovies = require('./AZMovies');
const Vidlox = require('./Vidlox');
const {VShare} = require('./VShare');
const SpeedVid = require('./SpeedVid');
const VidCloud = require('./VidCloud');
const ClipWatching = require('./ClipWatching');
const EStream = require('./EStream');
const Vidzi = require('./Vidzi');
const VidTodo = require('./VidTodo');
const {PowVideo} = require('./PowVideo');
const {GamoVideo} = require('./GamoVideo');
const GorillaVid = require('./GorillaVid');
const DaClips = require('./DaClips');
const MovPod = require('./MovPod');
const {Vidoza} = require('./Vidoza');

const createEvent = require('../../utils/createEvent');

async function resolve(sse, uri, source, jar, headers) {
    console.log(uri);
    try {
        if (uri.includes('openload.co') || uri.includes('oload.cloud')) {
            const path = uri.split('/');
            const videoId = path[4];
            if (!uri.includes('embed')) {
                uri = `https://openload.co/embed/${videoId}`;
            }
            const data = await Openload(uri, jar, headers);
            const event = createEvent(data, true, {url: 'https://olpair.com', videoId, target: uri}, '', 'Openload', source);
            sse.send(event, event.event);

        } else if (uri.includes('streamango.com')) {
            const data = await Streamango(uri, jar, headers);
            const event = createEvent(data, true, {target: uri}, '', 'Streamango', source);
            sse.send(event, event.event);

        } else if (uri.includes('rapidvideo.com')) {
            const data = await RapidVideo(uri, jar);
            const event = createEvent(data, false, {}, '', 'RapidVideo', source);
            sse.send(event, event.event);

        } else if (uri.includes('azmovies.co')) {
            const file = await AZMovies(uri, jar, headers);
            const event = createEvent(file, false, {}, '', 'AZMovies', source);
            sse.send(event, event.event);

        } else if (uri.includes('vidlox.me') || uri.includes('vidlox.tv')) {
            const dataList = await Vidlox(uri, jar, headers);
            dataList.forEach(data => {
                const event = createEvent(data, false, {}, '', 'Vidlox', source);
                sse.send(event, event.event);
            });

        } else if (uri.includes('vshare.eu')) {
            const path = uri.split('/');
            let videoId = path[path.length - 1].replace('.html', '');
            if (!uri.includes('embed')) {
                videoId = path[path.length - 1].replace('.htm', '');
                uri = `https://vshare.eu/embed-${videoId}.html`;
            }
            const data = await VShare(uri, jar, headers);
            const event = createEvent(data, true, {url: 'https://vshare.eu/pair', videoId, target: uri}, '', 'VShare', source);
            sse.send(event, event.event);

        } else if (uri.includes('speedvid.net')) {
            if (!uri.includes('embed')) {
                const path = uri.split('/');
                const videoId = path[path.length - 1];
                uri = `http://speedvid.net/embed-${videoId}.html`;
            }
            const dataList = await SpeedVid(uri, jar, headers);
            dataList.forEach(data => {
                const event = createEvent(data, false, {}, '', 'SpeedVid', source);
                sse.send(event, event.event);
            });

        } else if (uri.includes('vidcloud.co')) {
            if (!uri.includes('player?fid=')) {
                const path = uri.split('/');
                const videoId = path[path.length - 2];
                uri = `https://vidcloud.co/player?fid=${videoId}&page=video`;
            }
            const dataObjects = await VidCloud(uri, jar, headers);
            dataObjects.forEach(dataObject => {
                const event = createEvent(!!dataObject.file ? dataObject.file : dataObject.link, false, {}, '', 'VidCloud', source);
                sse.send(event, event.event);
            });

        } else if (uri.includes('clipwatching.com')) {
            const dataObjects = await ClipWatching(uri, jar, headers);
            dataObjects.forEach(dataObject => {
                const event = createEvent(dataObject.file, false, {}, dataObject.label, 'ClipWatching', source);
                sse.send(event, event.event);
            });

        } else if (uri.includes('estream.to') || uri.includes('estream.xyz')) {
            // const path = uri.split('/');
            // const videoId = path[path.length - 1];
            // const videoSourceUrls = await EStream(`http://estream.xyz/embed-${videoId}`, jar, clientIp, userAgent);
            // videoSourceUrls.forEach(source => sse.send({videoSourceUrl: source, url, provider: 'http://estream.xyz'}, 'results'));
            // // All the links are broken...

        } else if (uri.includes('vidzi.online')) {
            // const sources = await Vidzi(uri, jar, clientIp, userAgent);
            // sources.forEach((source) => sse.send({videoSourceUrl: source.file, url, provider: 'https://vidzi.online'}, 'results'));
            // // All the links are broken...

        } else if (uri.includes('vidto.me')) {
            // console.log('Skipping vidto.me because the links are always broken.');

        } else if (uri.includes('vidup.me') || uri.includes('vidup.tv') || uri.includes('thevideo.me') || uri.includes('vev.io') || uri.includes('vidup.io')) {
            // console.log('Skipping vidup.me because captcha');

        } else if (uri.includes('vidtodo.me') || uri.includes('vidtodo.com') || uri.includes('vidstodo.me')) {
            const dataObjects = await VidTodo(uri, jar, headers);
            dataObjects.forEach(dataObject => {
                const event = createEvent(dataObject.file, false, {}, dataObject.label, 'VidTodo', source, {referer: uri.replace('vidtodo.me', 'vidstodo.me')});
                sse.send(event, event.event);
            });

        } else if (uri.includes('powvideo.net')) {
            const path = uri.split('/');
            let videoId = path[path.length - 1].replace('iframe-', '').replace('-954x562.html', '');
            if (!uri.includes('iframe')) {
                videoId = path[path.length - 1];
                uri = `https://povwideo.cc/iframe-${videoId}-954x562.html`;
            }
            const dataObjects = await PowVideo(uri, jar, headers, videoId);
            dataObjects.forEach(dataObject => {
                const event = createEvent(!!dataObject.file ? dataObject.file : dataObject.link, true, {target: uri, headers: {referer: `https://povwideo.cc/preview-${videoId}-954x562.html`}}, '', 'PowVideo', source);
                sse.send(event, event.event);
            });

        } else if (uri.includes('streamplay.to')) {
            // console.log('Skipping streamplay.to because captcha.');

        } else if (uri.includes('gamovideo.com')) {
            const dataList = await GamoVideo(uri, jar, headers);
            dataList.forEach(data => {
                const event = createEvent(data, true, {target: uri}, '', 'GamoVideo', source);
                sse.send(event, event.event);
            });

        } else if (uri.includes('gorillavid.com') || uri.includes('gorillavid.in')) {
            const dataObjects = await GorillaVid(uri, jar, headers);
            dataObjects.forEach(dataObject => {
                const event = createEvent(dataObject.src, false, {}, '', 'GorillaVid', source);
                sse.send(event, event.event);
            });

        } else if (uri.includes('daclips.com') || uri.includes('daclips.in')) {
            const dataObjects = await DaClips(uri, jar, headers);
            dataObjects.forEach(dataObject => {
                const event = createEvent(dataObject.src, false, {}, '', 'DaClips', source);
                sse.send(event, event.event);
            });

        } else if (uri.includes('movpod.com') || uri.includes('movpod.in')) {
            const dataObjects = await MovPod(uri, jar, headers);
            dataObjects.forEach(dataObject => {
                const event = createEvent(dataObject.src, false, {}, '', 'MovPod', source);
                sse.send(event, event.event);
            });

        } else if (uri.includes('vidoza.net')) {
            if (!uri.includes('embed')) {
                const path = uri.split('/');
                const videoId = path[3].replace('.html', '');
                uri = `https://vidoza.net/embed-${videoId}.html`;
            }
            const dataObjects = await Vidoza(uri, jar, headers);
            dataObjects.forEach(dataObject => {
                const event = createEvent(dataObject.src, true, {target: uri}, dataObject.res, 'Vidoza', source);
                sse.send(event, event.event);
            });

        } else {
            console.log('Still need a resolver for', uri);
        }
    } catch(err) {
        console.error(err);
    }
}

module.exports = exports = resolve;