var restify = require("restify");
var mongodb = require("mongodb");
var moment = require("moment");
var Levenshtein = require("levenshtein");
var config = require("./config");

var server = restify.createServer({
	name: "boxOfficeIdAPI",
	version: '1.0.0'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get("/", function(req, res, next) {

	// fuzzy year query
	var years = [
		parseInt(req.params.year) - 1,
		parseInt(req.params.year),
		parseInt(req.params.year) + 1
	];

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

		// movies available?
		if (movies.length > 0) {

			// filter out years
			movies = movies.filter(function(item) {
				return years.indexOf(moment(item.release).year);
			});

			res.send(movies);
			return next();

		} else {

			global.boxOfficeCol.find({}, {
				"fields": {
					"release": true,
					"name": true,
					"boxOfficeId": true
				}
			}).toArray(function(err, movies) {

				var min_lev = 9999999999.0;
				var min_movie = null;

				// levensthein distance of movie titles
				for (var i in movies) {
					var lev = new Levenshtein(movies[i].name, req.params.movie);
					var l = lev.valueOf();

					if (l < min_lev && years.indexOf(moment(movies[i].release).year)) {
						min_lev = l;
						min_movie = movies[i];
					}
				}

				res.send(min_movie);
				return next();
			});
		}
	});
});

// mongodb connect
mongodb.connect(config.MONGODB_URL, function(err, db) {

	if (err) console.log(err);

	// collections
	global.boxOfficeCol = db.collection("boxoffice_movies");

	server.listen(8191, function() {
		console.log("%s listening at %s", server.name, server.url);
	});
});