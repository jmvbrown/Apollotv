'use strict';

const providers =
	{
		movies: [
			// require('./movies/Afdah'),
			// require('./movies/AZMovies'),
			require('./movies/GoStream'),
		],
		tv: [
			require('./tv/GoWatchSeries'),
			require('./tv/SeriesFree'),
			require('./tv/AfdahTV'),
			require('./tv/Series8'),
			require('./tv/SwatchSeries'),
		],
		universal: [
		]
	}

module.exports = exports = providers;
