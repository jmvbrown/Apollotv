const providers =
	{
		movies: [
			require('./movies/Afdah'),
		],
		tv: [
			require('./tv/WatchSeries'),
		],
		universal: [
			require('./universal/AfdahTV'),
		]
	}

module.exports = exports = providers;
