import axios from 'axios';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import { Dropbox } from 'dropbox';

dotenv.config();

const { TWITTER_USERNAME, TWITTER_PASSWORD } = process.env;
const client = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
  fetch: require('isomorphic-fetch'),
});

async function maybeLoadCookies() {
  try {
    return JSON.parse(
      (await fs.promises.readFile('./cookies.json')).toString()
    );
  } catch (e) {
    return [];
  }
}

export async function loginOnTwitter(page: puppeteer.Page) {
  await page.goto('https://twitter.com/login', { waitUntil: 'networkidle2' });
  const cookies = await maybeLoadCookies();
  await page.setCookie(...(Array.from(cookies || []) as any));

  // fill the credentials
  console.log('logging in...');
  await page.click('[name="session[username_or_email]"]');
  await page.keyboard.type(TWITTER_USERNAME);
  await page.click('[name="session[password]"]');
  await page.keyboard.type(TWITTER_PASSWORD);

  // login for realz
  await page.click('[data-testid="LoginForm_Login_Button"]');
  // go to our profile
  await page.waitForSelector('[aria-label="Profile"]');
  console.log('Logged in');

  return page;
}

export async function downloadUrl(url: string) {
  const res = await axios({ method: 'GET', responseType: 'arraybuffer', url });
  return Buffer.from(res.data);
}

export async function getLastTweetDate() {
  try {
    const file = fs.readFileSync('./cache.txt');

    const fileContent = file.toString();

    return Number(fileContent) || 0;
  } catch (e) {
    return 0;
  }
}

export async function writeLastTweetDate(date: Date) {
  return fs.writeFileSync('./cache.txt', String(date.getTime()));
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
