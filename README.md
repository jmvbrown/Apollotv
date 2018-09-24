# Claws

The claws backend scraper for NXTV.

## Getting Started

### Installation

Install node (v10.10.0) and npm (v6.4.1).
- Clone the repo.
- Navigate to the directory.
- Run `npm install`.
- Copy the contents of `.env.dist` to a file called `.env`
- Fill in the values for `SECRET_SERVER_ID` and `SECRET_CLIENT_ID`

### Testing the server

- Set the `SECRET_CLIENT_ID` inside `public/index.html` to match the same value inside `.env`
- Run `node server.js` (or `npm start`)
- Open your browser to `127.0.0.1:3000`

#### Movies
- Search for the exact name of a movie, like `The Avengers`.
- Open the developer console and watch the links arrive.

Calling the Movie API:
- URL: `127.0.0.1:3000/api/search`
- Querystrings required: <br>
    `queryString`: movie title (exact name) <br>
    `token`: valid JWT token


#### TV
- Search for a TV show by filling in name, season, episode. Eg: `Suits 4 1` (in the respective text boxes)
- Open the developer console and watch the links arrive.

Calling the TV API:
- URL: `127.0.0.1:3000/api/search/tv`
- Querystrings required: <br>
    `show`: name of show <br>
    `season`: season <br>
    `episode`: episode <br>
    `token`: valid JWT token
