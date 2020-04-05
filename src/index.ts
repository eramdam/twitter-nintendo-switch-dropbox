import { fetchTweetImages } from './fetchTweetImages';

(async () => {
  await fetchTweetImages();
  process.exit(0);
})();
