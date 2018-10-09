const providers =
	{
		movies: [
			require('./movies/Afdah'),
			require('./movies/AZMovies'),
		],
		tv: [
			require('./tv/SeriesFree'),
			require('./tv/AfdahTV'),
		],
		universal: [
		]
	}

module.exports = exports = providers;
