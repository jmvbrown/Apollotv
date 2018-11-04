'use strict';

const providers =
	{
		movies: [
			// require('./movies/Afdah'),
			// require('./movies/AZMovies'),
		],
		tv: [
			require('./tv/AfdahTV'),
			// require('./tv/GoWatchSeries'),
			require('./tv/SeriesFree'),
			require('./tv/SwatchSeries'),
		],
		universal: [
		]
	}

module.exports = exports = providers;
