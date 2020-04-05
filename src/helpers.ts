import axios from 'axios';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';

dotenv.config();

const { TWITTER_USERNAME, TWITTER_PASSWORD } = process.env;

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
  console.log({ cookies });
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

export async function downloadUrl(url: string, path: string) {
  const fileStream = fs.createWriteStream(path);
  const response = await axios({ method: 'GET', responseType: 'stream', url });

  response.data.pipe(fileStream);

  return new Promise((resolve, reject) => {
    fileStream.on('finish', () => {
      console.log(`saved ${url} in ${path}`);
      resolve();
    });
    fileStream.on('error', reject);
  });
}
