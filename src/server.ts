import * as express from 'express';
import { fetchTweetImages } from './fetchTweetImages';

const app = express();

app.get('/', async (request, response) => {
  try {
    await fetchTweetImages();
  } catch (e) {
    return response.sendStatus(200);
  }

  return response.sendStatus(200);
});

app.listen(process.env.PORT || 9999);
