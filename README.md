# Claws
The server-side scraper software for ApolloTV.

## Getting Started

### Installation
Install node^10.10.0 and npm^6.4.1.
- Clone the repository and navigate to the directory.
- Run `npm install`.
- Copy the contents of `.env.dist` to a file called `.env`.
- Fill in the values for `SECRET_SERVER_ID` and `SECRET_CLIENT_ID`.
    - You can use `./generate-env-values.sh` to help.

### Security
In order to authenticate with the server, the client must make a login
request with the hashed (using the `bcrypt` library) `SECRET_CLIENT_ID` and the 
current time. It will look like this before it's hashed: 

`${current time in seconds}|${SECRET_CLIENT_ID}`

The server then checks the resulting hash with it's own version starting the 
second the request arrives to the server. It will check up to 5 seconds back in 
time just in case the client has a slow connection.

If the hash is valid within the time frame of 5 seconds, it is authorized and 
the server sends a token down to the client that will last 1 hour. After the 
hour is up, the client will request another token.

### Testing the server

### Running in Development Mode
- Set the `SECRET_CLIENT_ID` inside `public/index.html` to match the same value inside `.env`
- Run `npm run dev`
- Open your browser to `http://127.0.0.1:3000`

### Running in Production Mode
- Run `npm start`
- Set up an nginx `proxy_pass` to `http://127.0.0.1:3000`.


### API

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
- Querystrings required:  
    `show`: name of show  
    `season`: season  
    `episode`: episode  
    `token`: valid JWT token
