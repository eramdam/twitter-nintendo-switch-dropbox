import axios from 'axios';
import * as dotenv from 'dotenv';
import { Dropbox } from 'dropbox';
import * as fs from 'fs';
import { Stream, Duplex } from 'stream';

dotenv.config();

const client = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
  fetch: require('isomorphic-fetch'),
});

export function streamToBuffer(stream: Stream) {
  return new Promise<Buffer>((resolve, reject) => {
    let buffers = [];
    stream.on('error', reject);
    stream.on('data', (data) => buffers.push(data));
    stream.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

export function bufferToStream(buffer: Buffer) {
  const stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

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
