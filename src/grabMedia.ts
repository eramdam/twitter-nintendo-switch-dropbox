import dotenv from 'dotenv';
import _ from 'lodash';
import Twit from 'twit';
import {
  downloadUrl,
  getLastTweetId,
  uploadFileToDropbox,
  writeLastTweetId,
} from './helpers';

dotenv.config();

export async function grabMedia() {
  const lastTweetId = await getLastTweetId();
  console.log({ lastTweetId });

  const {
    TWITTER_CONSUMER_KEY,
    TWITTER_CONSUMER_SECRET,
    TWITTER_ACCESS_TOKEN_KEY,
    TWITTER_ACCESS_TOKEN_SECRET,
  } = process.env;
  const T = new Twit({
    consumer_key: TWITTER_CONSUMER_KEY,
    consumer_secret: TWITTER_CONSUMER_SECRET,
    access_token: TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: TWITTER_ACCESS_TOKEN_SECRET,
    strictSSL: true,
  });

  await T.get('account/verify_credentials');
  console.log('Credentials still valid.');

  const timelineResponse = await T.get('statuses/user_timeline', {
    exclude_replies: true,
    include_rts: false,
    include_entities: true,
    trim_user: true,
    since_id: lastTweetId || undefined,
  });

  const tweets = timelineResponse.data as any[];

  if (!tweets.length) {
    console.log('No tweet to process, exiting.');
    return;
  }

  const mediaObjects = _(tweets)
    .filter((t: any) => {
      return t.source.includes('Nintendo Switch');
    })
    .map((t) => extractMediaFilesFromTweetJson(t))
    .flatten()
    .value();

  if (!mediaObjects.length) {
    console.log('No media to process, exiting.');
    return;
  }

  await writeLastTweetId(tweets[0].id_str);

  console.log(`Found ${mediaObjects.length} items in ${tweets.length} tweets`);

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
}

function extractMediaFilesFromTweetJson(tweetJson: any) {
  const hasPhotos = tweetJson.extended_entities.media[0].type === 'photo';
  const date = new Date(tweetJson.created_at);

  if (hasPhotos) {
    return Array.from(tweetJson.extended_entities.media).map(
      (entity: any, index) => {
        return {
          date,
          index,
          tweetId: tweetJson.id_str,
          url: entity.media_url_https + ':orig',
          type: 'photo',
        };
      }
    );
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
