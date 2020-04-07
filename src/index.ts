import * as dotenv from 'dotenv';
import { flatten } from 'lodash';
import * as puppeteer from 'puppeteer';
import {
  downloadUrl,
  getLastTweetDate,
  maybeLoginOnTwitter,
  uploadFileToDropbox,
  writeLastTweetDate,
} from './helpers';

dotenv.config();

(async () => {
  const lastTweetDate = await getLastTweetDate();
  console.log('Last tweet date', new Date(lastTweetDate));
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Shouldn't be necessary but I prefer to be paranoid.
  const userAgent = await page.evaluate(() => navigator.userAgent);
  await page.setUserAgent(userAgent.replace('HeadlessChrome', 'Chrome'));
  await maybeLoginOnTwitter(page);

  // Due to potential timing issues, we need to setup this listener _before_ we navigate.
  let profileJsonResponse: puppeteer.Response = undefined;
  page.on('response', (response) => {
    // This should be the API request performed to get the tweets of our profile.
    if (
      response.request().url().includes('2/timeline/profile') &&
      response.request().method() === 'GET'
    ) {
      profileJsonResponse = response;
    }
  });

  await page.goto(`https://twitter.com/${process.env.TWITTER_USERNAME}`, {
    waitUntil: 'networkidle2',
  });
  console.log('Profile loaded');

  console.log('Got response', Boolean(profileJsonResponse));
  const profileJson: any = await profileJsonResponse.json();
  const lastTweets = findTweetsBeforeDateInProfile(profileJson, lastTweetDate);

  if (!lastTweets.length) {
    console.log('No tweet to process, exiting');
    process.exit(0);
  }

  await writeLastTweetDate(new Date(lastTweets[0].created_at));

  const mediaObjects = flatten(
    lastTweets.map((tweet) => extractMediaFilesFromTweetJson(tweet))
  );

  console.log(
    `Found ${mediaObjects.length} items in ${lastTweets.length} tweets`
  );

  if (!mediaObjects.length) {
    console.log('No media found in the tweets, exiting');
    process.exit(0);
  }

  for (const mediaObject of mediaObjects) {
    console.log(
      `Uploading ${mediaObjects.indexOf(mediaObject) + 1} of ${
        mediaObjects.length
      }`
    );
    const { date, url, type, tweetId, index } = mediaObject;
    const month = date.toLocaleString(undefined, {
      month: '2-digit',
    });
    const day = date.toLocaleString(undefined, {
      day: '2-digit',
    });
    const year = date.toLocaleString(undefined, {
      year: 'numeric',
    });

    const fileBuffer = downloadUrl(url);
    const ext = type === 'photo' ? 'jpg' : 'mp4';

    await uploadFileToDropbox(
      fileBuffer,
      `/${year}-${month}-${day}/${tweetId}-${index + 1}.${ext}`
    );
  }

  await browser.close();

  process.exit(0);
})();

function findTweetsBeforeDateInProfile(profileJson: any, maxTimestamp: number) {
  const tweets = Object.values(profileJson.globalObjects?.tweets) as any[];
  const sortedTweets = tweets
    .filter((tweet) => {
      return String(tweet.source).includes('Nintendo Switch Share');
    })
    .sort((a, b) => {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  if (!maxTimestamp) {
    return [sortedTweets[0]];
  }

  return sortedTweets.filter((tweet) => {
    return new Date(tweet.created_at) > new Date(maxTimestamp);
  });
}

function extractMediaFilesFromTweetJson(tweetJson: any) {
  const hasPhotos = tweetJson.extended_entities.media[0].type === 'photo';
  const date = new Date(tweetJson.created_at);

  if (hasPhotos) {
    return Array.from(tweetJson.entities.media).map((entity: any, index) => {
      return {
        date,
        index,
        tweetId: tweetJson.id_str,
        url: entity.media_url_https + ':orig',
        type: 'photo',
      };
    });
  }

  return Array.from(tweetJson.extended_entities.media)
    .map((entity: any) => {
      const variants: any[] = Array.from(entity.video_info.variants);
      const bitRates = variants.map((variant) => Number(variant.bitrate || 0));
      const maxBitrate = Math.max(...bitRates);

      return variants.find((v) => maxBitrate === v.bitrate);
    })
    .map((v, index) => ({
      date,
      index,
      tweetId: tweetJson.id_str,
      url: v.url,
      type: 'video',
    }));
}
