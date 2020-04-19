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

#### Using crontab

You should be able to configure a crontab that runs `npm start`. I would write documentation on how to get this working, but I never managed to have it working, so I ended up using the tmux/screen method below

#### Using screen or tmux

1. Launch a screen/tmux session
2. Navigate to the repository
3. Run `npm run cron`
4. Detatch your screen/tmux session
5. Profit!

This is hacky but at least it works

If everything works, you should see screenshots and videos being added to your Dropbox, like in the screenshot below

![](media/dropbox-screenshot.png)
