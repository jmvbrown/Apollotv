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

**Calling the authentication API:**

*Logging in*

- URL: `/api/v1/login`
- Method: `POST`
- Body:
```json
{
  "clientId": "{...}"
}
```

*Checking authentication status*
- URL: `/api/v1/authenticated`
- Method: `GET` or `POST`
- Parameters:
    - `token`: JWT token to validate.
- Body (`POST`):
```json
{
  "token": "{...}"
}
```

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

**Calling the Movie API:**
- Endpoint: `/api/v1/search/movies`
- Method: `GET`
- Parameters
    - `title`: movie title (exact name) <br>
    - `token`: valid JWT token


#### TV
- Search for a TV show by filling in name, season, episode. Eg: `Suits 4 1` (in the respective text boxes)
- Open the developer console and watch the links arrive.

**Calling the TV API:**
- Endpoint: `/api/v1/search/tv`
- Method: `GET`
- Parameters
    - `show`: name of show
    - `season`: season
    - `episode`: episode
    - `token`: valid JWT token


#### Event Structure
```javascript
{
    // The event type
    "event": "result",

    // The link to the source.
    "file": {
        "data": "",
        // Mime type or `file` for a base64 encoded m3u8 file
        "kind": "",
    },

    // Pairing (but a last resort)
    "pairing": {
        url: '',
        videoId: ''
        target: ''
    },

    // Metadata
    "metadata": {
        // The link quality
        "quality": "",

        // The provider's name (human readable)
        "provider": "",

        // The source that uploaded the content to the provider (human readable)
        "source": ""
    },

    // Required headers (last resort - may not even be possible)
    "headers": {
        "Referrer": ""
    }
}
```

```javascript
{
    // The event type
    "event": "scrape",

    // The provider URL that Claws needs the HTML from
    "target": "",

    // The resolver to send the HTML to
    "resolver": "",
}
```