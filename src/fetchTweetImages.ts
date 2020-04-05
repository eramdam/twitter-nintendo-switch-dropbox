import * as dotenv from 'dotenv';
import { flatten } from 'lodash';
import * as puppeteer from 'puppeteer';
import {
  downloadUrl,
  getLastTweetDate,
  loginOnTwitter,
  uploadFileToDropbox,
  writeLastTweetDate,
} from './helpers';

dotenv.config();

export async function fetchTweetImages() {
  const lastTweetDate = await getLastTweetDate();
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await loginOnTwitter(page);

  await page.click('[aria-label="Profile"]');
  const profileJsonResponse = await page.waitForResponse((response) => {
    return (
      response.request().url().includes('2/timeline/profile') &&
      response.request().method() === 'GET'
    );
  });
  console.log('Profile loaded');

  const profileJson: any = await profileJsonResponse.json();
  const lastTweets = findTweetsBeforeDateInProfile(profileJson, lastTweetDate);

  if (!lastTweets.length) {
    console.log('No tweet to process, exiting');
    return;
  }

  await writeLastTweetDate(new Date(lastTweets[0].created_at));

  console.log(`Found ${lastTweets.length} to process`);

  const mediaObjects = flatten(
    lastTweets.map((tweet) => extractMediaFilesFromTweetJson(tweet))
  );

  if (!mediaObjects.length) {
    console.log('No media found in the tweets, exiting');
    return;
  }

  await Promise.all(
    mediaObjects.map(({ date, url, type, tweetId }, index) => {
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

      return uploadFileToDropbox(
        fileBuffer,
        `/${year}-${month}-${day}/${tweetId}-${index + 1}.${ext}`
      );
    })
  );
}

function findTweetsBeforeDateInProfile(profileJson: any, maxTimestamp: number) {
  const tweets = Object.values(profileJson.globalObjects?.tweets) as any[];
  const sortedTweets = tweets.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
    return Array.from(tweetJson.entities.media).map((entity: any) => {
      return {
        date,
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
    .map((v) => ({
      date,
      tweetId: tweetJson.id_str,
      url: v.url,
      type: 'video',
    }));
}
