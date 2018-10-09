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

### Security
In order to become authorized with the server, the client must make a login
request with the hashed (using the bcrypt library) SECRET_CLIENT_KEY and the 
current time. It will look like this before it's hashed: 

`${current time in seconds}|${SECRET_CLIENT_ID}`

The server then checks the resulting hash with it's own version starting the 
second the request arrives to the server. It will check up to 5 seconds back in 
time just in case the client has a slow connection.

If the hash is valid within the time frame of 5 seconds, it is authorized and 
the server sends a token down to the client that will last 1 hour. After the 
hour is up, the client will request another token.

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
