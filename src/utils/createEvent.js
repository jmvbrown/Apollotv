const URL = require('url');

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

module.exports = exports = createEvent;