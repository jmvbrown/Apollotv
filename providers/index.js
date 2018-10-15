const providers =
	{
		movies: [
			require('./movies/Afdah'),
			require('./movies/AZMovies'),
		],
		tv: [
			// require('./tv/SeriesFree'),
			// require('./tv/AfdahTV'),
			require('./tv/SwatchSeries'),
		],
		universal: [
		]
	}

module.exports = exports = providers;
