const providers =
	{
		movies: [
			require('./movies/Afdah'),
			require('./movies/AZMovies'),
		],
		tv: [
			// require('./tv/WatchSeries'),
			require('./tv/AfdahTV'),
		],
		universal: [
		]
	}

module.exports = exports = providers;
