const URL = require('url');
const Openload = require('./Openload');
const Streamango = require('./Streamango');
const RapidVideo = require('./RapidVideo');
const AZMovies = require('./AZMovies');

async function resolve(sse, uri, source, jar, headers) {
	console.log(uri);
	try {
		if (uri.includes('openload.co')) {
	        const link = await Openload(uri, jar, headers);
	        const event = createEvent(link, true, 'https://olpair.com', '', 'Openload', source);
	        sse.send(event, event.event);

	    } else if (uri.includes('streamango.com')) {
	        const link = await Streamango(uri, jar, headers);
	        const event = createEvent(link, true, '', '', 'Streamango', source);
	        sse.send(event, event.event);

	    } else if (uri.includes('rapidvideo.com')) {
	    	const link = await RapidVideo(uri, jar);
	        const event = createEvent(link, false, '', '', 'RapidVideo', source);
	        sse.send(event, event.event);

	    } else if (uri.includes('azmovies.co')) {
	    	const file = await AZMovies(uri, jar, headers);
	        const event = createEvent(file, false, '', '', 'AZMovies', source, headers);
	        sse.send(event, event.event);

	    } else {
	        console.log('Still need a resolver for', uri);
	    }
	} catch(err) {
		console.error(err);
	}
}

function createEvent(link, ipLocked, pairing, quality, provider, source, headers) {
	if (ipLocked && process.env.NODE_ENV === 'production') {
		return {
		    event: 'scrape',
		    target: link,
		    resolver: provider
		}
	}

	return {
	    event: 'result',
	    file: {
	        link,
	        kind: getMimeType(link),
	    },
	    pairing,
	    metadata: {
	        quality,
	        provider,
	        source
	    },
	    headers
	};
}

function getMimeType(link) {
	const file = URL.parse(link).pathname;

	if (file.endsWith('.mp4')) {
		return 'video/mp4';
	} else if (file.endsWith('.m3u8')) {
		return 'application/x-mpegURL';
	} else if (file.endsWith('.mkv')) {
		return 'video/x-matroska';
	} else {
		return 'video/*';
	}
}

module.exports = exports = resolve;