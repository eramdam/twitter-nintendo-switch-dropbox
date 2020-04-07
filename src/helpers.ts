import axios from 'axios';
import * as dotenv from 'dotenv';
import { Dropbox } from 'dropbox';
import * as fs from 'fs';

dotenv.config();

const client = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
  fetch: require('isomorphic-fetch'),
});

/** Downloads a given URL and returns its content as a Buffer. */
export async function downloadUrl(url: string) {
  const res = await axios({ method: 'GET', responseType: 'arraybuffer', url });
  return Buffer.from(res.data);
}

export async function getLastTweetId() {
  try {
    const file = fs.readFileSync('./cache.txt');

    const fileContent = file.toString();

    return fileContent || '';
  } catch (e) {
    return '';
  }
}

export async function writeLastTweetId(id: string) {
  return fs.writeFileSync('./cache.txt', id);
}

export async function uploadFileToDropbox(
  filePromise: Promise<Buffer> | Buffer,
  dropboxPath: string
) {
  console.log('Uploading ', dropboxPath);
  return client
    .filesUpload({
      path: dropboxPath,
      contents: await filePromise,
    })
    .then(console.log)
    .catch(console.error);
}
