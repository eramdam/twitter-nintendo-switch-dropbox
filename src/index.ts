import * as puppeteer from 'puppeteer';
import * as url from 'url';
import * as path from 'path';
import * as dotenv from 'dotenv';

import { downloadUrl, loginOnTwitter } from './helpers';

dotenv.config();

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await loginOnTwitter(await browser.newPage());

  await page.click('[aria-label="Profile"]');
  await page.waitForSelector('[data-testid="tweet"] time');
  console.log('Profile loaded');

  const dateString = await page.evaluate(() => {
    return (document.querySelector(
      '[data-testid="tweet"] time'
    ) as HTMLTimeElement).dateTime;
  });

  await page.click('[data-testid="tweet"] time');
  await page.waitForSelector('[aria-label="Back"]');
  console.log('Last tweet loaded');

  console.log('Extracting images');
  const imagesUrls = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll(
        '[data-testid="tweet"] + div img[src*="media/"]'
      )
    )
      .map((node) => {
        return (node.getAttribute('src') || '').replace('small', 'orig');
      })
      .filter((url) => url.includes('https://'))
      .map((url) => {
        const urlObject = new URL(url);
        urlObject.searchParams.set('name', 'orig');
        return urlObject.toString();
      });
  });

  if (!imagesUrls.length) {
    console.log('no images, nothing to do');
    process.exit(0);
  }

  const dateObject = new Date(dateString);

  await Promise.all(
    imagesUrls.map((imageUrl) => {
      const filename =
        url.parse(imageUrl).pathname.split('/media/')[1] +
        '-' +
        dateObject.getTime() +
        '.jpg';

      const filepath = path.resolve('.', 'media', filename);

      console.log('saving ', filename);
      return downloadUrl(imageUrl, filepath);
    })
  );

  process.exit(0);
})();
