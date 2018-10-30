const Openload = require('./Openload');
const Streamango = require('./Streamango');
const RapidVideo = require('./RapidVideo');
const AZMovies = require('./AZMovies');

const createEvent = require('../../utils/createEvent');

async function resolve(sse, uri, source, jar, headers) {
	console.log(uri);
	try {
		if (uri.includes('openload.co') || uri.includes('oload.cloud')) {
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

module.exports = exports = resolve;