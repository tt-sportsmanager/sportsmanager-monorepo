import { Handler } from '@netlify/functions';
import { sportsManagerQuery, Seed } from '../theGraph';
import * as R from 'ramda';
import { sharedResponseHeaders } from '../utils';

interface SeededSportsManager {
  id: number;
  seed: Seed;
}

const buildSeededSportsManager = R.pick(['id', 'seed']);

const buildSeededSportsManagerMap = R.map(buildSeededSportsManager);

const handler: Handler = async (event, context) => {
  const sportsManager = await sportsManagerQuery();
  const seededSportsManagerArray: SeededSportsManager[] = buildSeededSportsManagerMap(sportsManager);
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      ...sharedResponseHeaders,
    },
    body: JSON.stringify(seededSportsManagerArray),
  };
};

export { handler };
