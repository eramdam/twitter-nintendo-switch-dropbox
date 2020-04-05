# What's this?

Like the (very verbose) repo name implies, this is a small Node script that scrapes your Twitter profile to grab Nintendo Switch media and upload a copy of it to Dropbox for later sharing/archival.

# How do I use this?

You will need a couple of things:

- A machine/server running NodeJS*
  - I'll figure out how to setup this repo on [Glitch](https://glitch.com/) soon so it will be serverless™️ 😎
- A Twitter account (duh), private or public
- A Dropbox account with a personal app created, alongside an access token (if you don't know how to get this, [here's a tutorial](http://99rabbits.com/get-dropbox-access-token/))


## Setup

Clone the repo:

```
git clone https://github.com/eramdam/twitter-nintendo-switch-dropbox
```

Then, create a new file called `.env` at the root of the repo and fill it as follows:

```
TWITTER_USERNAME='your username'
TWITTER_PASSWORD='your password'
DROPBOX_ACCESS_TOKEN='your dropbox access token'
```

Now, while you *could* run the script right now, you'll want to run the following command. It will login once to your account and store the cookies locally so they can be re-used. This will prevent Twitter from telling you that a new device connected to your account every time the script runs!

```
npm run dump-cookies
```

Okay, now you can run the script for real!

```
npm start
```

If everything went well, you should now have a new folder in your `Apps` folder in your Dropbox! (Obviously you will see whatever last Nintendo Switch media is on your account).

![](media/dropbox-screenshot.png)


Now, you probably don't want to run this script everytime you want to get your Switch media. So you'll want to setup a crontab or similar on your system, here's how it would look like for `crontab`:

```
* * * * * /path/to/your/clone/of/the/repo/crontab.sh > ~/logs/twitter-nintendo-switch.log
```

And you're done! Hooray!