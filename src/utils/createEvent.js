const URL = require('url');

function createEvent(data, ipLocked, pairing, quality, provider, source, headers) {
	if (ipLocked && process.env.NODE_ENV === 'production') {
		return {
		    event: 'scrape',
		    target: data,
		    resolver: provider
		}
	}

	return {
	    event: 'result',
	    file: {
	        data,
	        kind: getDataKind(data),
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

function getDataKind(link) {
	const file = URL.parse(link).pathname;

	if (file.endsWith('.mp4')) {
		return 'video/mp4';
	} else if (file.endsWith('.m3u8')) {
		return 'application/x-mpegURL';
	} else if (file.endsWith('.mkv')) {
		return 'video/x-matroska';
	} else if (file.endsWith('==')) {
		return 'file';
	} else {
		return 'video/*';
	}
}

module.exports = exports = createEvent;