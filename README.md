# What's this?

Like the (very verbose) repo name implies, this is a small Node script that uses Twitter's API to download media uploaded using the Nintendo Switch Twitter integration and uploads them to Dropbox for archival and later sharing.

# How do I use this?

You will need a couple of things:

- A machine/server running NodeJS (the more recent the better)
  - I'll figure out how to setup this repo on [Glitch](https://glitch.com/) soon so it will be serverless™️ 😎
- A twitter app on your account and the access tokens (see [this tutorial](botwiki.org/tutorials/how-to-create-a-twitter-app))
- A Dropbox account with a personal app created, alongside an access token (if you don't know how to get this, [here's a tutorial](http://99rabbits.com/get-dropbox-access-token/))

## Setup

Clone the repo:

```
git clone https://github.com/eramdam/twitter-nintendo-switch-dropbox
```

Then, create a new file called `.env` at the root of the repo and fill it as follows:

```
DROPBOX_ACCESS_TOKEN='**REQUIRED**'
TWITTER_CONSUMER_KEY='**REQUIRED**'
TWITTER_CONSUMER_SECRET='**REQUIRED**'
TWITTER_ACCESS_TOKEN_KEY='**REQUIRED**'
TWITTER_ACCESS_TOKEN_SECRET='**REQUIRED**'
SCRIPT_ENDPOINT='a-random-suite-of-words'
```

Finally, install the dependencies of the project:

```
npm i
```

Then build the JS files

```
npm run build
```

## Running

### On your own server

Find a way to run the main npm script in the background.
I personally use a tmux session that runs `npm start` but you can use something like [forever](https://npm.im/forever) or [pm2](https://npm.im/pm2).

Then, you basically want to call your web server on a regular basis (every minute works great and will keep you below Twitter's API's rate limit), this is trivial using cron

```
* * * * * curl http://localhost:3000/a-random-suite-of-words
```

### On Glitch.com

TODO

![](media/dropbox-screenshot.png)
