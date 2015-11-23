# boxOfficeIdAPI
Give me a movie title and it's year and I'll give you the BoxOfficeId :-P

## Install

```
npm install
```

Create a *config.json* file and add the MongoDB connection URL into it:

e.g.

```
exports.MONGODB_URL = "mongodb://localhost:27017/oscar";
```

## Run

```
npm start
```

## Query

Query for movie "Birdman" that was released in year "2014" by fuzzy searching also available via:

/?movie=Birdmans&year=2013

*Make sure that ?movie is URL-Encoded*