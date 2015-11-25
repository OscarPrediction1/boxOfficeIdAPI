var restify = require("restify");
var mongodb = require("mongodb");
var moment = require("moment");
var Levenshtein = require("levenshtein");
var logger = require("morgan");
var config = require("./config");

// movie cache
var cached_movies = null;

var server = restify.createServer({
	name: "boxOfficeIdAPI",
	version: '1.0.0'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(logger("dev"));

server.get("/", function(req, res, next) {

	// query box office for direct movie name and year
	global.boxOfficeCol.find({
		"name": req.params.movie
	}, {
		"fields": {
			"release": true,
			"name": true,
			"boxOfficeId": true
		}
	}).toArray(function(err, movies) {

		// filter out years
		movies = movies.filter(function(item) {
			return Math.abs(parseInt(req.params.year) - moment(item.release).year()) <= 1;
		});

		// movies available?
		if (movies.length > 0) {

			res.send(movies);
			return next();

		} else {

			var processAllMovies = function(movies) {

				// filter out years
				movies = movies.filter(function(item) {
					return Math.abs(parseInt(req.params.year) - moment(item.release).year()) <= 1;
				});

				var min_lev = Number.MAX_VALUE;
				var min_movie = null;

				// levensthein distance of movie titles
				for (var i in movies) {
					var lev = new Levenshtein(movies[i].name, req.params.movie);
					var l = lev.valueOf();

					if (l < min_lev && l <= 1) {
						min_lev = l;
						min_movie = movies[i];
					}
				}

				res.send(min_movie || []);
				return next();
			}

			// check if value is in cache
			if (!cached_movies) {

				// attempt full table scan
				global.boxOfficeCol.find({}, {
					"fields": {
						"release": true,
						"name": true,
						"boxOfficeId": true
					}
				}).toArray(function(err, movies) {

					// cache movies result for blazing fast future queries
					cached_movies = movies;

					processAllMovies(movies);
				});

			} else {
				processAllMovies(cached_movies);
			}
		}
	});
});

// mongodb connect
mongodb.connect(config.MONGODB_URL, function(err, db) {

	if (err) throw err;

	// collections
	global.boxOfficeCol = db.collection("boxoffice_movies");

	server.listen(8191, function() {
		console.log("%s listening at %s", server.name, server.url);
	});
});
