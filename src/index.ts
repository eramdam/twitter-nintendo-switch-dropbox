import * as puppeteer from 'puppeteer';
import * as url from 'url';
import * as path from 'path';
import * as dotenv from 'dotenv';

import { downloadUrl, loginOnTwitter, uploadFileToDropbox } from './helpers';

dotenv.config();

(async () => {
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
  const lastTweet = findLastTweetInProfile(profileJson);

  if (!lastTweet) {
    console.log('No tweet found, exiting');
    process.exit(0);
  }

  const mediaObjects = extractMediaFilesFromTweetJson(lastTweet);
  const tweetCreationDate = new Date(lastTweet.created_at);

  if (!mediaObjects) {
    console.log('No media found on the last tweet, exiting');
    process.exit(0);
  }

  console.log('mediaObjects', mediaObjects);
  await Promise.all(
    mediaObjects.map((mediaObject, index) => {
      const month = tweetCreationDate.toLocaleString(undefined, {
        month: '2-digit',
      });
      const day = tweetCreationDate.toLocaleString(undefined, {
        day: '2-digit',
      });
      const year = tweetCreationDate.toLocaleString(undefined, {
        year: 'numeric',
      });

      const fileBuffer = downloadUrl(mediaObject.url);
      const ext = mediaObject.type === 'photo' ? 'jpg' : 'mp4';

      return uploadFileToDropbox(
        fileBuffer,
        `/${year}-${month}-${day}/${lastTweet.id_str}-${index + 1}.${ext}`
      );
    })
  );

  process.exit(0);
})();

function findLastTweetInProfile(profileJson: any) {
  const tweets = Object.values(profileJson.globalObjects?.tweets) as any[];

  return tweets.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })[0];
}

function extractMediaFilesFromTweetJson(tweetJson: any) {
  const hasPhotos = tweetJson.extended_entities.media[0].type === 'photo';

  if (hasPhotos) {
    return Array.from(tweetJson.entities.media).map((entity: any) => {
      return {
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
      url: v.url,
      type: 'video',
    }));
}
